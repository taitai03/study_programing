import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { allowedUsers, user as userTable } from "@/db/schema";
import { auth } from "./auth";

export type Role = "learner" | "mentor" | "admin";

export type CurrentUser = {
  id: string;
  name: string;
  image: string | null;
  githubLogin: string;
  role: Role;
};

/**
 * ログイン中のユーザーを返す。未ログイン、または許可リストから外れている場合は null。
 * ロールは毎回 allowed_users から読むので、管理画面での変更がすぐに反映される
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const [row] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      image: userTable.image,
      githubLogin: userTable.githubLogin,
      role: allowedUsers.role,
    })
    .from(userTable)
    .innerJoin(allowedUsers, eq(allowedUsers.githubLogin, userTable.githubLogin))
    .where(eq(userTable.id, session.user.id));

  if (!row?.githubLogin) return null;
  return { ...row, githubLogin: row.githubLogin };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

/** メンター向けの画面（受講者の進捗、提出）を見られるのは mentor と admin */
export async function requireMentor(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role === "learner") redirect("/dashboard");
  return user;
}
