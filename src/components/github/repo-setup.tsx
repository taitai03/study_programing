import { AlertTriangleIcon, CheckCircle2Icon, ExternalLinkIcon, GitBranchIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { courseRepos } from "@/db/schema";
import { templateRepoName } from "@/lib/content/loader";
import type { Course } from "@/lib/content/schema";
import { githubAppConfigured, githubAppInstallUrl } from "@/lib/github/app";
import { SyncButton } from "./sync-button";

type CourseRepo = typeof courseRepos.$inferSelect;

/** PRで解くコースの準備（課題リポジトリを作って、GitHub App をインストールする） */
export function RepoSetup({
  course,
  repo,
  githubLogin,
}: {
  course: Pick<Course, "templateRepo">;
  repo: CourseRepo | null;
  githubLogin: string;
}) {
  const name = templateRepoName(course);
  if (!course.templateRepo || !name) return null;
  const installUrl = githubAppInstallUrl();

  if (repo) {
    return (
      <div className="space-y-3 rounded-lg border p-5">
        <div className="flex flex-wrap items-center gap-3">
          <CheckCircle2Icon className="size-5 text-green-600" />
          <span className="font-medium">課題リポジトリ:</span>
          <a
            href={`https://github.com/${repo.repoFullName}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-mono text-sm underline-offset-4 hover:underline"
          >
            {repo.repoFullName}
            <ExternalLinkIcon className="size-3.5" />
          </a>
          <div className="ml-auto">
            <SyncButton />
          </div>
        </div>
        {!repo.isPrivate && (
          <Alert>
            <AlertTriangleIcon />
            <AlertTitle>リポジトリが public になっています</AlertTitle>
            <AlertDescription>
              課題の解答が誰でも見られる状態です。GitHub のリポジトリの Settings → General の一番下（Danger Zone）から、private に変更してください。
            </AlertDescription>
          </Alert>
        )}
        <pre className="overflow-x-auto rounded-md bg-muted px-4 py-3 text-[13px]">
          <code>{`git clone git@github.com:${repo.repoFullName}.git\ncd ${name}`}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <GitBranchIcon className="size-5" />
        はじめに: 課題リポジトリを用意する
      </h2>
      <p className="text-sm text-muted-foreground">
        このコースの課題は、自分の GitHub アカウントに作ったリポジトリで解き、PRを出して提出します。最初に一度だけ、次の準備をしてください。
      </p>
      <ol className="list-decimal space-y-4 pl-5 text-sm">
        <li className="space-y-2">
          <p>
            テンプレートから、自分のアカウントにリポジトリを作ります。次の3点を必ず守ってください。
          </p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Repository name は <code className="font-mono">{name}</code>（テンプレートと同じ名前）
            </li>
            <li>
              <strong className="text-foreground">Private</strong> を選ぶ
            </li>
            <li>
              <strong className="text-foreground">Include all branches</strong>{" "}
              にチェックを入れる（課題の開始ブランチもコピーするため）
            </li>
          </ul>
          <Button size="sm" asChild>
            <a
              href={`https://github.com/${course.templateRepo}/generate`}
              target="_blank"
              rel="noreferrer"
            >
              テンプレートからリポジトリを作る
              <ExternalLinkIcon />
            </a>
          </Button>
        </li>
        <li className="space-y-2">
          <p>
            作ったリポジトリに GitHub App をインストールします。「Only select repositories」を選び、
            <code className="font-mono">
              {githubLogin}/{name}
            </code>{" "}
            を選んでください。インストールすると、このアプリにPRとテストの結果が届くようになります。
          </p>
          {installUrl ? (
            <Button size="sm" asChild>
              <a href={installUrl} target="_blank" rel="noreferrer">
                GitHub App をインストールする
                <ExternalLinkIcon />
              </a>
            </Button>
          ) : (
            <p className="text-destructive">
              GitHub App が設定されていません（GITHUB_APP_SLUG）。管理者に連絡してください。
            </p>
          )}
        </li>
        <li className="space-y-2">
          <p>インストールが終わったら、このページを読み直してください。連携されたリポジトリが表示されます。</p>
          {githubAppConfigured() && <SyncButton label="連携を確認する" />}
        </li>
      </ol>
    </div>
  );
}
