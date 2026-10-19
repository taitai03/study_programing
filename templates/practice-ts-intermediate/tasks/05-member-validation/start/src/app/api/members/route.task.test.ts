// 課題のテスト（変更しないでください）
import { eq } from "drizzle-orm";
import { members } from "@/db/schema";
import { db } from "@/test/db";
import { POST } from "./route";

function register(body: unknown) {
  return POST(
    new Request("http://localhost/api/members", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("POST /api/members（会員登録）", () => {
  it("正しい入力なら 201 で会員とAPIトークンを返す。前後の空白は取り除き、メールアドレスは小文字にする", async () => {
    const res = await register({ name: "  山田 花子 ", email: " Hanako.Yamada@Example.com " });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.member).toMatchObject({ name: "山田 花子", email: "hanako.yamada@example.com" });
    expect(body.apiToken).toEqual(expect.any(String));
    const saved = db.select().from(members).where(eq(members.email, "hanako.yamada@example.com")).get();
    expect(saved?.rank).toBe("regular");
  });

  it.each([
    ["名前がない", { email: "a@example.com" }, ["name"]],
    ["名前が空白だけ", { name: "   ", email: "a@example.com" }, ["name"]],
    ["名前が51文字", { name: "あ".repeat(51), email: "a@example.com" }, ["name"]],
    ["メールアドレスの形式が違う", { name: "山田", email: "yamada@" }, ["email"]],
    ["メールアドレスが文字列でない", { name: "山田", email: 123 }, ["email"]],
    ["両方とも正しくない", { name: "", email: "x" }, ["name", "email"]],
  ])("%s: 400 で、項目ごとのエラーメッセージを返す", async (_, input, keys) => {
    const res = await register(input);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toEqual(expect.any(String));
    expect(Object.keys(body.fields).sort()).toEqual([...keys].sort());
    for (const key of keys) expect(body.fields[key]).toEqual(expect.any(String));
  });

  it("名前はちょうど50文字なら登録できる", async () => {
    expect((await register({ name: "あ".repeat(50), email: "fifty@example.com" })).status).toBe(201);
  });

  it("JSON でないリクエストは 400", async () => {
    const res = await register("name=yamada");
    expect(res.status).toBe(400);
    expect((await res.json()).error).toEqual(expect.any(String));
  });

  it("登録済みのメールアドレス（大文字・小文字の違いも同じとみなす）は 409", async () => {
    const res = await register({ name: "別の人", email: "MEMBER0001@example.com" });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toEqual(expect.any(String));
    expect(await db.$count(members)).toBe(20);
  });

  it("エラーのときは会員を登録しない", async () => {
    await register({ name: "", email: "new@example.com" });
    expect(await db.$count(members)).toBe(20);
  });
});
