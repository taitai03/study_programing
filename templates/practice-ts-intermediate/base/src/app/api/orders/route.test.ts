import { members, orders } from "@/db/schema";
import { db } from "@/test/db";
import { GET, POST } from "./route";

function post(body: unknown, token = "member-0001-token") {
  return POST(
    new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/orders", () => {
  it("会員のAPIトークンで注文を作れる", async () => {
    const res = await post({ items: [{ productId: 1, quantity: 1 }] });
    expect(res.status).toBe(201);
    const { order } = await res.json();
    expect(order.memberId).toBe(1);
  });

  it("トークンが正しくなければ 401、内容が正しくなければ 400", async () => {
    expect((await post({ items: [{ productId: 1, quantity: 1 }] }, "wrong")).status).toBe(401);
    expect((await post({ items: [] })).status).toBe(400);
    const res = await post({ items: [{ productId: 999, quantity: 1 }] });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("購入できない商品");
  });
});

describe("GET /api/orders", () => {
  it("新しい順に50件ずつ返す", async () => {
    const res = await GET(new Request("http://localhost/api/orders"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orders).toHaveLength(50);
    const times = body.orders.map((o: { createdAt: string }) => Date.parse(o.createdAt));
    expect([...times].sort((a, b) => b - a)).toEqual(times);

    const page3 = await (await GET(new Request("http://localhost/api/orders?page=3"))).json();
    expect(page3.orders).toHaveLength(0);
    expect(await db.$count(orders)).toBe(100);
  });

  it("ログインしていなければ 401", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    expect((await GET(new Request("http://localhost/api/orders"))).status).toBe(401);
    expect(await db.$count(members)).toBe(20);
  });
});
