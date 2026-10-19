import { eq } from "drizzle-orm";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { verifyPassword } from "@/lib/password";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: "admin" | "staff" } & DefaultSession["user"];
  }
  interface User {
    role?: "admin" | "staff";
  }
}

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

/**
 * スタッフのログイン（Auth.js）。メールアドレスとパスワードで認証し、セッションは JWT で持つ
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const found = db.select().from(staff).where(eq(staff.email, parsed.data.email)).get();
        if (!found || !verifyPassword(parsed.data.password, found.passwordHash)) return null;
        return { id: String(found.id), name: found.name, email: found.email, role: found.role };
      },
    }),
  ],
  pages: { signIn: "/login" },
  // ローカルで動かす研修用のアプリなので、どのホスト名（localhost:3000 など）からのアクセスも受け付ける
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.role = token.role === "admin" ? "admin" : "staff";
      return session;
    },
  },
});
