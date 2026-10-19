"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { allowedUsers, session, user } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

// GitHubのユーザー名: 英数字とハイフン、39文字まで
const githubLoginSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/, "GitHubのユーザー名の形式ではありません");

const roleSchema = z.enum(["learner", "mentor", "admin"]);

export type FormState = { error?: string; ok?: string } | null;

export async function addAllowedUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const login = githubLoginSchema.safeParse(formData.get("githubLogin"));
  const role = roleSchema.safeParse(formData.get("role"));
  if (!login.success) return { error: login.error.issues[0].message };
  if (!role.success) return { error: "権限を選んでください" };

  const inserted = await db
    .insert(allowedUsers)
    .values({ githubLogin: login.data, role: role.data, invitedBy: admin.githubLogin })
    .onConflictDoNothing()
    .returning();
  if (inserted.length === 0) return { error: `${login.data} はすでに登録されています` };

  revalidatePath("/admin/users");
  return { ok: `${login.data} を登録しました` };
}

export async function changeRole(githubLogin: string, role: string) {
  const admin = await requireAdmin();
  const parsed = roleSchema.parse(role);
  if (githubLogin === admin.githubLogin && parsed !== "admin") {
    throw new Error("自分自身の管理者権限は外せません");
  }
  await db.update(allowedUsers).set({ role: parsed }).where(eq(allowedUsers.githubLogin, githubLogin));
  revalidatePath("/admin/users");
}

export async function removeAllowedUser(githubLogin: string) {
  const admin = await requireAdmin();
  if (githubLogin === admin.githubLogin) throw new Error("自分自身は削除できません");

  await db.delete(allowedUsers).where(eq(allowedUsers.githubLogin, githubLogin));
  // ログイン中のセッションも消して、すぐに使えなくする。学習の記録は残す
  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.githubLogin, githubLogin));
  if (u) await db.delete(session).where(eq(session.userId, u.id));
  revalidatePath("/admin/users");
}
