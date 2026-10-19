import { randomBytes } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { type MemberRank, members } from "@/db/schema";

export const RANK_LABELS: Record<MemberRank, string> = {
  regular: "一般",
  silver: "シルバー",
  gold: "ゴールド",
};

export function listMembers(db: Db) {
  return db.select().from(members).orderBy(asc(members.id)).all();
}

export function findMemberByToken(db: Db, token: string) {
  return db.select().from(members).where(eq(members.apiToken, token)).get();
}

export function findMemberByEmail(db: Db, email: string) {
  return db.select().from(members).where(eq(members.email, email)).get();
}

/** 会員を登録する。会員ランクは一般から始まり、APIトークンを発行する */
export function registerMember(db: Db, input: { name: string; email: string }) {
  return db
    .insert(members)
    .values({ ...input, rank: "regular", points: 0, apiToken: randomBytes(24).toString("hex") })
    .returning()
    .get();
}
