import { ExternalLinkIcon, InfoIcon, LightbulbIcon } from "lucide-react";
import Link from "next/link";
import { SubmissionStatusBadge, formatDateTime } from "@/components/github/submission-status";
import { SyncButton } from "@/components/github/sync-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { courseRepos, submissions } from "@/db/schema";
import { type Lesson, startBranch } from "@/lib/content/loader";
import { courseHref } from "@/lib/course-progress";
import type { PullRequestSummary } from "@/lib/pull-requests";

type Props = {
  lesson: Lesson;
  repo: typeof courseRepos.$inferSelect | null;
  pullRequests: (typeof submissions.$inferSelect)[];
  passed: boolean;
  ticketHtml: string;
  hintHtmls: string[];
};

/** ローカルで解いてPRを出す課題 */
export function TaskSection({ lesson, repo, pullRequests, passed, ticketHtml, hintHtmls }: Props) {
  const start = startBranch(lesson);
  const work = `work/${lesson.slug}`;

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 border-b pb-2 text-lg font-semibold">
        演習（チケット）
        {passed && <Badge variant="secondary">合格済み</Badge>}
      </h2>
      <p className="text-sm text-muted-foreground">
        自分の課題リポジトリで解き、開始ブランチ <code className="font-mono">{start}</code>{" "}
        に向けてPRを出してください。テストがすべて通った状態でPRをマージすると合格です。
      </p>

      <div
        className="prose prose-sm max-w-none rounded-lg border p-5 dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: ticketHtml }}
      />

      {hintHtmls.length > 0 && (
        <div className="space-y-2">
          {hintHtmls.map((html, i) => (
            <details key={html} className="rounded-md border px-4 py-2 text-sm">
              <summary className="flex cursor-pointer items-center gap-2 font-medium">
                <LightbulbIcon className="size-4 text-amber-500" />
                ヒント {i + 1}
              </summary>
              <div
                className="prose prose-sm max-w-none pt-2 dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </details>
          ))}
        </div>
      )}

      <h3 className="font-semibold">進め方</h3>
      {!repo && (
        <Alert>
          <InfoIcon />
          <AlertTitle>課題リポジトリがまだ連携されていません</AlertTitle>
          <AlertDescription>
            <p>
              <Link href={courseHref(lesson.courseId)} className="underline underline-offset-4">
                コースのページ
              </Link>
              の手順で、テンプレートからリポジトリを作り、GitHub App をインストールしてください。
            </p>
          </AlertDescription>
        </Alert>
      )}
      <ol className="list-decimal space-y-2 pl-5 text-sm">
        <li>開始ブランチから作業用のブランチを切ります。課題文は TASK.md にもあります</li>
        <li>実装してテストを実行し、commit・push します</li>
        <li>
          <code className="font-mono">{start}</code> に向けてPRを作ります（main ではありません）
        </li>
        <li>テストが通ったら、PRの説明を見直してマージします</li>
      </ol>
      <pre className="overflow-x-auto rounded-md bg-muted px-4 py-3 text-[13px]">
        <code>
          {[
            "git fetch origin",
            `git switch ${start}`,
            `git switch -c ${work}`,
            "# 実装してテストを実行し、commit する",
            `git push -u origin ${work}`,
          ].join("\n")}
        </code>
      </pre>
      {repo && (
        <Button size="sm" asChild>
          <a
            href={`https://github.com/${repo.repoFullName}/compare/${start}...${work}?expand=1`}
            target="_blank"
            rel="noreferrer"
          >
            {start} に向けてPRを作る
            <ExternalLinkIcon />
          </a>
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        課題で用意したテストと <code>.github/</code> を変更したPRは、判定の対象外になります。
      </p>

      <div className="flex items-center gap-3 pt-2">
        <h3 className="font-semibold">提出したPR</h3>
        {repo && (
          <div className="ml-auto">
            <SyncButton label="判定を読み直す" />
          </div>
        )}
      </div>
      {pullRequests.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだPRはありません。</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PR</TableHead>
                <TableHead>コミット</TableHead>
                <TableHead>判定</TableHead>
                <TableHead>更新</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pullRequests.map((s) => {
                const pr = s.summary as PullRequestSummary;
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex max-w-80 items-center gap-2">
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate underline-offset-4 hover:underline"
                        >
                          #{s.prNumber} {pr.title}
                        </a>
                        {pr.merged && (
                          <Badge variant="outline" className="shrink-0">
                            マージ済み
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.headSha?.slice(0, 7)}</TableCell>
                    <TableCell>
                      <SubmissionStatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(s.updatedAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
