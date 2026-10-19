import { BookOpenIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { devLoginEnabled, NOT_ALLOWED_ERROR } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { devLogin } from "./actions";
import { GitHubLoginButton } from "./github-button";

export const metadata: Metadata = { title: "ログイン" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { error } = await searchParams;
  const githubConfigured = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <BookOpenIcon className="mx-auto mb-2 size-8" />
          <CardTitle className="text-xl">Study Programming</CardTitle>
          <CardDescription>
            業務で自分でコードを書けるようになるための、社内のプログラミング学習アプリです。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>ログインできませんでした</AlertTitle>
              <AlertDescription>
                {error === NOT_ALLOWED_ERROR
                  ? "このGitHubアカウントは利用を許可されていません。管理者に登録を依頼してください。"
                  : "もう一度お試しください。解決しない場合は管理者に連絡してください。"}
              </AlertDescription>
            </Alert>
          )}
          {githubConfigured ? (
            <GitHubLoginButton />
          ) : (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              GitHub App が未設定です。.env.local に GITHUB_CLIENT_ID と GITHUB_CLIENT_SECRET を設定してください（docs/github-app.md）。
            </p>
          )}
          {devLoginEnabled && (
            <div className="space-y-2 rounded-md border border-dashed p-3">
              <p className="text-xs text-muted-foreground">開発用ログイン（ローカル環境のみ）</p>
              <form className="flex gap-2">
                <Button
                  formAction={devLogin.bind(null, "learner")}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  受講者として
                </Button>
                <Button
                  formAction={devLogin.bind(null, "admin")}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  管理者として
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
