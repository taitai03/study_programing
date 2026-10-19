import { AlertTriangleIcon, ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmissionStatusBadge, formatDateTime } from "@/components/github/submission-status";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getLesson } from "@/lib/content/loader";
import type { GhPullRequestFile } from "@/lib/github/app";
import { getSubmission, getSubmissionDiff } from "@/lib/mentor";
import type { PullRequestSummary } from "@/lib/pull-requests";
import { requireMentor } from "@/lib/session";

type Props = PageProps<"/mentor/submissions/[id]">;

export const metadata: Metadata = { title: "提出の詳細" };

export default async function SubmissionPage({ params }: Props) {
  await requireMentor();
  const { id } = await params;
  const row = Number.isInteger(Number(id)) ? await getSubmission(Number(id)) : null;
  if (!row || row.submission.kind !== "pull_request") notFound();

  const { submission: sub, learner } = row;
  const pr = sub.summary as PullRequestSummary;
  const lesson = await getLesson(sub.lessonId);

  let files: GhPullRequestFile[] | null = null;
  let diffError: string | null = null;
  try {
    files = await getSubmissionDiff(sub.repoFullName ?? "", pr.baseRef, sub.headSha ?? "");
    if (!files) diffError = "リポジトリの連携が外れているため、差分を読めません。";
  } catch (e) {
    console.error(e);
    diffError = "GitHub から差分を読めませんでした。時間をおいて開き直してください。";
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <div className="space-y-3">
        <Link
          href={`/mentor/users/${learner.githubLogin}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {learner.name} の学習状況
        </Link>
        <h1 className="text-2xl font-bold">
          PR #{sub.prNumber} {pr.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <SubmissionStatusBadge status={sub.status} />
          {pr.merged && <Badge variant="outline">マージ済み</Badge>}
          <span>{lesson ? lesson.title : sub.lessonId}</span>
          <span className="font-mono">
            {pr.headRef} → {pr.baseRef}（{sub.headSha?.slice(0, 7)}）
          </span>
          <span>更新: {formatDateTime(sub.updatedAt)}</span>
          <a
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:underline"
          >
            GitHub で開く
            <ExternalLinkIcon className="size-3.5" />
          </a>
        </div>
      </div>

      {pr.tamperedFiles.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>変更してはいけないファイルが変更されています（判定対象外）</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 font-mono">
              {pr.tamperedFiles.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">テストの結果</h2>
        {pr.checks.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだテストの結果はありません。</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {pr.checks.map((c) => (
              <li key={c.name} className="flex items-center gap-2">
                <span>{c.conclusion === "success" ? "✅" : c.conclusion === null ? "⏳" : "❌"}</span>
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noreferrer" className="hover:underline">
                    {c.name}
                  </a>
                ) : (
                  c.name
                )}
                <span className="text-muted-foreground">{c.conclusion ?? "実行中"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">差分（開始ブランチとの比較）</h2>
        {diffError && <p className="text-sm text-destructive">{diffError}</p>}
        {files?.length === 0 && <p className="text-sm text-muted-foreground">変更はありません。</p>}
        {files?.map((f) => <FileDiff key={f.filename} file={f} />)}
      </section>
    </div>
  );
}

function FileDiff({ file }: { file: GhPullRequestFile }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-2 text-sm">
        <span className="font-mono">
          {file.previous_filename ? `${file.previous_filename} → ` : ""}
          {file.filename}
        </span>
        <span className="ml-auto text-xs">
          <span className="text-green-600">+{file.additions}</span>{" "}
          <span className="text-red-600">-{file.deletions}</span>
        </span>
      </div>
      {file.patch ? (
        <pre className="overflow-x-auto text-[12px] leading-5">
          {file.patch.split("\n").map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith("+")
                  ? "bg-green-500/10 px-4"
                  : line.startsWith("-")
                    ? "bg-red-500/10 px-4"
                    : line.startsWith("@@")
                      ? "bg-blue-500/10 px-4 text-muted-foreground"
                      : "px-4"
              }
            >
              {line || " "}
            </div>
          ))}
        </pre>
      ) : (
        <p className="px-4 py-2 text-sm text-muted-foreground">
          差分を表示できません（バイナリファイル、または大きすぎるファイル）
        </p>
      )}
    </div>
  );
}
