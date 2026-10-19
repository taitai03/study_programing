import { auth } from "@/auth";
import { db } from "@/db";
import { findMemberByToken } from "./members";

/** APIのエラーレスポンス。形を揃えて { error: メッセージ } で返す */
export function errorResponse(status: number, message: string, extra?: Record<string, unknown>) {
  return Response.json({ error: message, ...extra }, { status });
}

/** 会員向けAPIの認証。Authorization: Bearer <APIトークン> の会員を返す */
export function authenticateMember(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token) return null;
  return findMemberByToken(db, token) ?? null;
}

/** スタッフ向けAPIの認証。管理画面にログインしているスタッフを返す */
export async function authenticateStaff() {
  const session = await auth();
  return session?.user ?? null;
}

/** "12" のような文字列を、正の整数のIDにする。IDでなければ null */
export function parseId(value: string) {
  return /^[1-9]\d*$/.test(value) ? Number(value) : null;
}
