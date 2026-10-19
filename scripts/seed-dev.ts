// 開発用ログインのユーザーを作る。実行: npm run seed:dev
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { eq } = await import("drizzle-orm");
  const { db } = await import("@/db");
  const { allowedUsers, user } = await import("@/db/schema");
  const { auth, devLoginEnabled } = await import("@/lib/auth");
  const { DEV_USERS } = await import("@/lib/dev-users");

  if (!devLoginEnabled) throw new Error(".env.local で DEV_LOGIN=true にしてください");
  const password = process.env.DEV_LOGIN_PASSWORD;
  if (!password) throw new Error(".env.local に DEV_LOGIN_PASSWORD を設定してください");

  for (const dev of Object.values(DEV_USERS)) {
    await db
      .insert(allowedUsers)
      .values({ githubLogin: dev.githubLogin, role: dev.role, invitedBy: "seed-dev" })
      .onConflictDoUpdate({ target: allowedUsers.githubLogin, set: { role: dev.role } });

    const [existing] = await db.select().from(user).where(eq(user.email, dev.email));
    if (!existing) {
      await auth.api.signUpEmail({ body: { email: dev.email, password, name: dev.name } });
    }
    await db.update(user).set({ githubLogin: dev.githubLogin }).where(eq(user.email, dev.email));
    console.log(`作成しました: ${dev.email}（${dev.role}）`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
