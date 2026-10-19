import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const NOT_ALLOWED_ERROR = "not_allowed";

/** 開発用ログイン（メールとパスワード）。GitHub OAuth App なしで動作確認するためのもので、本番では有効にならない */
export const devLoginEnabled =
  process.env.NODE_ENV !== "production" && process.env.DEV_LOGIN === "true";

/**
 * 許可リストに載っているか確認する。
 * INITIAL_ADMIN_GITHUB_LOGIN のユーザーは、未登録なら管理者として登録してから許可する
 */
export async function isAllowed(githubLogin: string | null | undefined) {
  if (!githubLogin) return false;
  const login = githubLogin.toLowerCase();

  const [row] = await db
    .select()
    .from(schema.allowedUsers)
    .where(eq(schema.allowedUsers.githubLogin, login));
  if (row) return true;

  if (login === process.env.INITIAL_ADMIN_GITHUB_LOGIN?.toLowerCase()) {
    await db
      .insert(schema.allowedUsers)
      .values({ githubLogin: login, role: "admin", invitedBy: "initial-admin" })
      .onConflictDoNothing();
    return true;
  }
  return false;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      mapProfileToUser: (profile) => ({
        githubLogin: profile.login.toLowerCase(),
      }),
    },
  },
  emailAndPassword: { enabled: devLoginEnabled, autoSignIn: false },
  user: {
    additionalFields: {
      githubLogin: { type: "string", required: false, input: false },
    },
    // GitHubでログインするとき、ユーザーを作る前に許可リストを確認する
    validateUserInfo: async ({ source }) => {
      if (source.method !== "oauth") return;
      const login = source.oauth?.profile?.login;
      if (!(await isAllowed(typeof login === "string" ? login : null))) {
        return { error: NOT_ALLOWED_ERROR };
      }
    },
  },
  databaseHooks: {
    session: {
      create: {
        // 許可リストから外された人が、既存のアカウントでログインし直せないようにする
        before: async (session) => {
          const [row] = await db
            .select({ githubLogin: schema.user.githubLogin })
            .from(schema.user)
            .where(eq(schema.user.id, session.userId));
          if (!(await isAllowed(row?.githubLogin))) return false;
        },
      },
    },
  },
  onAPIError: { errorURL: "/login" },
  plugins: [nextCookies()],
});
