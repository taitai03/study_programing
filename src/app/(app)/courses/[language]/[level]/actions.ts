"use server";

import { revalidatePath } from "next/cache";
import { githubAppConfigured } from "@/lib/github/app";
import { syncUserRepositories } from "@/lib/pull-requests";
import { requireUser } from "@/lib/session";

/** 自分の課題リポジトリの連携と、PRの判定を GitHub から読み直す */
export async function syncMyRepositories() {
  const user = await requireUser();
  if (!githubAppConfigured()) {
    return { ok: false, message: "GitHub App が設定されていません。管理者に連絡してください" };
  }
  try {
    const result = await syncUserRepositories(user.githubLogin);
    revalidatePath("/", "layout");
    if (!result.installed) {
      return { ok: false, message: "GitHub App がまだインストールされていません" };
    }
    return {
      ok: true,
      message:
        result.linked > 0
          ? `${result.linked}個のリポジトリを連携し、PRの判定を更新しました`
          : "連携できるリポジトリが見つかりませんでした。リポジトリ名と、App をインストールしたリポジトリを確認してください",
    };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "GitHub との通信に失敗しました。時間をおいて試してください" };
  }
}
