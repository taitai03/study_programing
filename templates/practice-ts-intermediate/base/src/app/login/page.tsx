import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { login } from "./actions";

export const metadata: Metadata = { title: "ログイン" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto mt-24 max-w-sm space-y-6 px-6">
      <h1 className="text-xl font-bold">さくらマート 管理画面</h1>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          メールアドレスかパスワードが違います
        </p>
      )}
      <form action={login} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email">メールアドレス</Label>
          <Input id="email" name="email" type="email" required autoComplete="username" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">パスワード</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <Button type="submit" className="w-full">
          ログイン
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        開発用のアカウント: admin@sakura-mart.example / password（npm run db:seed で作成）
      </p>
    </main>
  );
}
