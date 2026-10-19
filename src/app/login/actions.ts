"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, devLoginEnabled, NOT_ALLOWED_ERROR } from "@/lib/auth";
import { DEV_USERS, type DevUserKey } from "@/lib/dev-users";

/** 開発用ログイン。scripts/seed-dev.ts で作ったユーザーでログインする */
export async function devLogin(key: DevUserKey) {
  if (!devLoginEnabled) throw new Error("開発用ログインは無効です");
  try {
    await auth.api.signInEmail({
      body: { email: DEV_USERS[key].email, password: process.env.DEV_LOGIN_PASSWORD! },
      headers: await headers(),
    });
  } catch {
    // 許可リストにない場合など。GitHubログインと同じ表示にする
    redirect(`/login?error=${NOT_ALLOWED_ERROR}`);
  }
  redirect("/dashboard");
}
