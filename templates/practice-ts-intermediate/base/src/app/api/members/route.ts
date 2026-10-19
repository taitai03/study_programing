import { db } from "@/db";
import { registerMember } from "@/lib/members";

/**
 * 会員向け: 会員登録。登録した会員と、APIトークンを返す
 * TODO: 入力チェックがまだない（name や email が空でも登録できてしまう）
 */
export async function POST(request: Request) {
  const body = await request.json();
  const member = registerMember(db, { name: body.name, email: body.email });
  return Response.json(
    { member: { id: member.id, name: member.name, email: member.email }, apiToken: member.apiToken },
    { status: 201 },
  );
}
