import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courseRepos, submissions, user } from "@/db/schema";
import { getCourse, getCourses, getLesson, templateRepoName } from "./content/loader";
import {
  appRequest,
  type GhCheckRun,
  type GhPullRequest,
  type GhPullRequestFile,
  type GhRepository,
  GitHubApiError,
  installationRequest,
  installationRequestAll,
} from "./github/app";
import { lessonHref } from "./course-progress";
import { judgePullRequest, lessonSlugFromBaseRef, type PullRequestJudgement } from "./github/judge";
import { recordPass } from "./progress";

/** submissions.summary に入れるPRの情報 */
export type PullRequestSummary = {
  title: string;
  url: string;
  author: string;
  baseRef: string;
  headRef: string;
  state: "open" | "closed";
  merged: boolean;
  mergedAt: string | null;
  checks: PullRequestJudgement["checks"];
  tamperedFiles: string[];
};

// ---------------------------------------------------------------------------
// 課題リポジトリの紐付け
// ---------------------------------------------------------------------------

/**
 * App がインストールされたリポジトリを、持ち主の受講者のコースに紐付ける。
 * リポジトリ名がコースのテンプレートと同じ（例: practice-ts-intermediate）で、
 * 持ち主がこのアプリにログインしたことのあるユーザーなら紐付ける
 */
export async function linkRepository(repo: GhRepository, installationId: number) {
  const name = repo.name.toLowerCase();
  const course = (await getCourses()).find((c) => templateRepoName(c)?.toLowerCase() === name);
  if (!course) return null;

  const [owner] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.githubLogin, repo.owner.login.toLowerCase()));
  if (!owner) return null;

  await db.transaction(async (tx) => {
    // 同じリポジトリが別の紐付けに残っていたら外す（作り直し、持ち主の変更など）
    await tx.delete(courseRepos).where(eq(courseRepos.repoFullName, repo.full_name));
    await tx
      .insert(courseRepos)
      .values({
        userId: owner.id,
        courseId: course.id,
        repoFullName: repo.full_name,
        installationId,
        isPrivate: repo.private,
      })
      .onConflictDoUpdate({
        target: [courseRepos.userId, courseRepos.courseId],
        set: { repoFullName: repo.full_name, installationId, isPrivate: repo.private },
      });
  });
  return { userId: owner.id, courseId: course.id };
}

export async function unlinkRepository(repoFullName: string) {
  await db.delete(courseRepos).where(eq(courseRepos.repoFullName, repoFullName));
}

export async function unlinkInstallation(installationId: number) {
  await db.delete(courseRepos).where(eq(courseRepos.installationId, installationId));
}

export async function updateRepositoryVisibility(repoFullName: string, isPrivate: boolean) {
  await db.update(courseRepos).set({ isPrivate }).where(eq(courseRepos.repoFullName, repoFullName));
}

export async function getCourseRepo(userId: string, courseId: string) {
  const [row] = await db
    .select()
    .from(courseRepos)
    .where(and(eq(courseRepos.userId, userId), eq(courseRepos.courseId, courseId)));
  return row ?? null;
}

/**
 * 受講者のアカウントにある App のインストールを調べて、課題リポジトリを紐付け直し、PRの判定も更新する。
 * Webhook を取りこぼしたときや、ローカルで Webhook を受けられないときに、画面のボタンから実行する
 */
export async function syncUserRepositories(githubLogin: string) {
  let installation: { id: number };
  try {
    installation = await appRequest<{ id: number }>(`/users/${githubLogin}/installation`);
  } catch (e) {
    if (e instanceof GitHubApiError && e.status === 404) return { installed: false, linked: 0 };
    throw e;
  }

  const repos = await installationRequestAll<GhRepository>(
    installation.id,
    "/installation/repositories",
    (page) => (page as { repositories: GhRepository[] }).repositories,
  );
  let linked = 0;
  for (const repo of repos) {
    if (repo.owner.login.toLowerCase() !== githubLogin.toLowerCase()) continue;
    if (await linkRepository(repo, installation.id)) {
      linked++;
      await syncRepositoryPullRequests(repo.full_name);
    }
  }
  return { installed: true, linked };
}

// ---------------------------------------------------------------------------
// PRの判定
// ---------------------------------------------------------------------------

/** リポジトリにある課題のPR（開始ブランチに向けたもの）をすべて判定し直す */
export async function syncRepositoryPullRequests(repoFullName: string) {
  const [repo] = await db
    .select()
    .from(courseRepos)
    .where(eq(courseRepos.repoFullName, repoFullName));
  if (!repo) return;
  const pulls = await installationRequestAll<GhPullRequest>(
    repo.installationId,
    `/repos/${repoFullName}/pulls?state=all`,
  );
  for (const pr of pulls) {
    if (lessonSlugFromBaseRef(pr.base.ref)) await syncPullRequest(repoFullName, pr.number);
  }
}

/** コミットを含むPRをすべて判定し直す（テストのワークフローが終わったときに使う） */
export async function syncPullRequestsForCommit(repoFullName: string, sha: string) {
  const [repo] = await db
    .select()
    .from(courseRepos)
    .where(eq(courseRepos.repoFullName, repoFullName));
  if (!repo) return;
  const pulls = await installationRequest<GhPullRequest[]>(
    repo.installationId,
    `/repos/${repoFullName}/commits/${sha}/pulls`,
  );
  for (const pr of pulls) {
    if (lessonSlugFromBaseRef(pr.base.ref)) await syncPullRequest(repoFullName, pr.number);
  }
}

/**
 * PRを判定して、提出（head_sha ごとに1行）を記録する。
 * テストがすべて通った状態でマージされたら、レッスンの課題を合格にする。
 * 同じイベントが何度届いても結果が変わらないように、毎回 GitHub から最新の状態を読んで判定する
 */
export async function syncPullRequest(repoFullName: string, prNumber: number) {
  const [repo] = await db
    .select()
    .from(courseRepos)
    .where(eq(courseRepos.repoFullName, repoFullName));
  if (!repo) return null;

  const pr = await installationRequest<GhPullRequest>(
    repo.installationId,
    `/repos/${repoFullName}/pulls/${prNumber}`,
  );
  const slug = lessonSlugFromBaseRef(pr.base.ref);
  const [course, lesson] = await Promise.all([
    getCourse(repo.courseId),
    slug ? getLesson(`${repo.courseId}/${slug}`) : null,
  ]);
  if (!course || !lesson?.task) return null;

  const [files, checks] = await Promise.all([
    installationRequestAll<GhPullRequestFile>(
      repo.installationId,
      `/repos/${repoFullName}/pulls/${prNumber}/files`,
    ),
    installationRequest<{ check_runs: GhCheckRun[] }>(
      repo.installationId,
      `/repos/${repoFullName}/commits/${pr.head.sha}/check-runs?per_page=100`,
    ),
  ]);
  const judgement = judgePullRequest({
    files,
    checkRuns: checks.check_runs,
    protectedPaths: [...course.protectedPaths, ...lesson.task.protectedPaths],
  });

  const summary: PullRequestSummary = {
    title: pr.title,
    url: pr.html_url,
    author: pr.user.login,
    baseRef: pr.base.ref,
    headRef: pr.head.ref,
    state: pr.state,
    merged: pr.merged,
    mergedAt: pr.merged_at,
    checks: judgement.checks,
    tamperedFiles: judgement.tamperedFiles,
  };

  const [previous] = await db
    .select({ status: submissions.status })
    .from(submissions)
    .where(
      and(
        eq(submissions.repoFullName, repoFullName),
        eq(submissions.prNumber, prNumber),
        eq(submissions.headSha, pr.head.sha),
      ),
    );

  const now = new Date();
  await db
    .insert(submissions)
    .values({
      userId: repo.userId,
      lessonId: lesson.id,
      kind: "pull_request",
      status: judgement.status,
      summary,
      repoFullName,
      prNumber,
      headSha: pr.head.sha,
    })
    .onConflictDoUpdate({
      target: [submissions.repoFullName, submissions.prNumber, submissions.headSha],
      set: { status: judgement.status, summary, lessonId: lesson.id, updatedAt: now },
    });

  if (pr.merged && judgement.status === "passed") {
    await recordPass(repo.userId, lesson, "exercise");
  }

  // 判定が決まったときに、PRへ結果をコメントする（同じコメントを書き換える）
  if (judgement.status !== "pending" && previous?.status !== judgement.status) {
    await upsertResultComment(repo.installationId, repoFullName, pr, judgement, lesson.id).catch(
      (e) => console.error("PRへのコメントに失敗しました", e),
    );
  }
  return judgement;
}

const COMMENT_MARKER = "<!-- study-programing:result -->";

function resultCommentBody(
  pr: GhPullRequest,
  judgement: PullRequestJudgement,
  lessonId: string,
) {
  const sha = pr.head.sha.slice(0, 7);
  const lines = [COMMENT_MARKER];
  if (judgement.status === "passed") {
    lines.push(`✅ **合格**（${sha}）: テストがすべて通りました。`);
    lines.push("", "このPRをマージすると、課題が完了として記録されます。");
  } else if (judgement.status === "failed") {
    lines.push(`❌ **不合格**（${sha}）: 失敗しているテストがあります。`);
    lines.push("", "Actions のログで失敗したテストを確認し、直して push してください。");
    for (const c of judgement.checks.filter((c) => c.conclusion !== "success")) {
      lines.push(`- ${c.name}: ${c.conclusion}`);
    }
  } else {
    lines.push(`⚠️ **判定対象外**（${sha}）: 変更してはいけないファイルが変更されています。`);
    lines.push("", "課題で用意したテストと `.github/` は変更しないでください。元に戻して push すると、判定し直します。");
    for (const f of judgement.tamperedFiles) lines.push(`- \`${f}\``);
  }
  const appUrl = process.env.BETTER_AUTH_URL;
  if (appUrl) lines.push("", `[課題のページを開く](${appUrl}${lessonHref(lessonId)})`);
  return lines.join("\n");
}

async function upsertResultComment(
  installationId: number,
  repoFullName: string,
  pr: GhPullRequest,
  judgement: PullRequestJudgement,
  lessonId: string,
) {
  const body = resultCommentBody(pr, judgement, lessonId);
  const comments = await installationRequestAll<{ id: number; body: string }>(
    installationId,
    `/repos/${repoFullName}/issues/${pr.number}/comments`,
  );
  const existing = comments.find((c) => c.body.startsWith(COMMENT_MARKER));
  const init = { method: existing ? "PATCH" : "POST", body: JSON.stringify({ body }) };
  await installationRequest(
    installationId,
    existing
      ? `/repos/${repoFullName}/issues/comments/${existing.id}`
      : `/repos/${repoFullName}/issues/${pr.number}/comments`,
    init,
  );
}

// ---------------------------------------------------------------------------
// 表示用
// ---------------------------------------------------------------------------

export async function getLessonPullRequests(userId: string, lessonId: string) {
  return db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, userId),
        eq(submissions.lessonId, lessonId),
        eq(submissions.kind, "pull_request"),
      ),
    )
    .orderBy(desc(submissions.updatedAt));
}
