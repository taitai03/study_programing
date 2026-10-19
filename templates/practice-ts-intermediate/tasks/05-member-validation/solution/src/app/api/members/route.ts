import { db } from "@/db";
import { errorResponse } from "@/lib/api";
import { fieldErrors, memberInputSchema } from "@/lib/member-input";
import { findMemberByEmail, registerMember } from "@/lib/members";

/** 会員向け: 会員登録。登録した会員と、APIトークンを返す */
export async function POST(request: Request) {
  const body = await request.json().catch(() => undefined);
  if (body === undefined) return errorResponse(400, "リクエストの形式が正しくありません（JSON で送ってください）");

  const parsed = memberInputSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "入力内容に誤りがあります", { fields: fieldErrors(parsed.error) });
  }
  if (findMemberByEmail(db, parsed.data.email)) {
    return errorResponse(409, "このメールアドレスはすでに登録されています");
  }

  try {
    const member = registerMember(db, parsed.data);
    return Response.json(
      { member: { id: member.id, name: member.name, email: member.email }, apiToken: member.apiToken },
      { status: 201 },
    );
  } catch (e) {
    // ユーザーには詳しい原因を見せず、開発者向けにはログに残す
    console.error("会員登録に失敗しました", e);
    return errorResponse(500, "会員登録に失敗しました。時間をおいて試してください");
  }
}
