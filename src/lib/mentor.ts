import "server-only";
import { desc, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { allowedUsers, courseRepos, progress, submissions, user } from "@/db/schema";
import { type GhPullRequestFile, installationRequest } from "./github/app";

/** 受講者一覧（メンター向け）。ログインしたことのあるユーザーだけ */
export async function getLearners() {
  const [users, progressRows, lastSubmissions] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
        githubLogin: user.githubLogin,
        role: allowedUsers.role,
      })
      .from(user)
      .innerJoin(allowedUsers, eq(allowedUsers.githubLogin, user.githubLogin))
      .orderBy(user.name),
    db.select().from(progress),
    db
      .select({ userId: submissions.userId, at: max(submissions.updatedAt) })
      .from(submissions)
      .groupBy(submissions.userId),
  ]);

  return users.map((u) => {
    const rows = progressRows.filter((p) => p.userId === u.id);
    const progressMap = new Map(
      rows.map((r) => [
        r.lessonId,
        {
          status: r.status,
          exercisePassed: r.exercisePassedAt !== null,
          quizPassed: r.quizPassedAt !== null,
        },
      ]),
    );
    const dates = [
      ...rows.map((r) => r.updatedAt),
      lastSubmissions.find((s) => s.userId === u.id)?.at ?? null,
    ].filter((d): d is Date => d !== null);
    const lastActivity = dates.length
      ? new Date(Math.max(...dates.map((d) => d.getTime())))
      : null;
    return { ...u, githubLogin: u.githubLogin ?? "", progressMap, lastActivity };
  });
}

export async function getLearner(githubLogin: string) {
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      githubLogin: user.githubLogin,
      role: allowedUsers.role,
    })
    .from(user)
    .innerJoin(allowedUsers, eq(allowedUsers.githubLogin, user.githubLogin))
    .where(eq(user.githubLogin, githubLogin.toLowerCase()));
  return row ?? null;
}

export async function getUserSubmissions(userId: string, limit = 100) {
  return db
    .select()
    .from(submissions)
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissions.updatedAt))
    .limit(limit);
}

export async function getUserRepos(userId: string) {
  return db.select().from(courseRepos).where(eq(courseRepos.userId, userId));
}

export async function getSubmission(id: number) {
  const [row] = await db
    .select({ submission: submissions, learner: { name: user.name, githubLogin: user.githubLogin } })
    .from(submissions)
    .innerJoin(user, eq(user.id, submissions.userId))
    .where(eq(submissions.id, id));
  return row ?? null;
}

// ---------------------------------------------------------------------------
// PRの差分（DBには保存せず、表示のたびに GitHub から読む。短時間だけキャッシュする）
// ---------------------------------------------------------------------------

const DIFF_TTL_MS = 60_000;
const diffCache = new Map<string, { at: number; files: GhPullRequestFile[] }>();

/** 開始ブランチと提出したコミットの差分。受講者のリポジトリに招待されていなくても、App の権限で読める */
export async function getSubmissionDiff(repoFullName: string, baseRef: string, headSha: string) {
  const key = `${repoFullName}:${baseRef}...${headSha}`;
  const cached = diffCache.get(key);
  if (cached && Date.now() - cached.at < DIFF_TTL_MS) return cached.files;

  const [repo] = await db
    .select({ installationId: courseRepos.installationId })
    .from(courseRepos)
    .where(eq(courseRepos.repoFullName, repoFullName));
  if (!repo) return null;

  const res = await installationRequest<{ files?: GhPullRequestFile[] }>(
    repo.installationId,
    `/repos/${repoFullName}/compare/${baseRef}...${headSha}`,
  );
  const files = res.files ?? [];
  diffCache.set(key, { at: Date.now(), files });
  return files;
}
