"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export async function login(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
  } catch (e) {
    // ログインに失敗したときだけ、エラーを表示する（成功時のリダイレクトはそのまま投げ直す）
    if (e instanceof AuthError) redirect("/login?error=1");
    throw e;
  }
}
