import { eq } from "drizzle-orm";
import { products } from "@/db/schema";
import { db } from "@/test/db";
import { GET as getProduct } from "./[id]/route";
import { GET } from "./route";

describe("会員向けの商品API", () => {
  it("一覧は公開中の商品だけを返す", async () => {
    const { products: list } = await (await GET()).json();
    const published = db.select().from(products).where(eq(products.isPublished, true)).all();
    expect(list).toHaveLength(published.length);
    expect(list[0]).toEqual({
      id: 1,
      name: "国産こしひかり 5kg",
      description: expect.any(String),
      price: 2980,
      category: "食品",
    });
  });

  it("詳細: 非公開の商品と、存在しない商品は 404", async () => {
    const params = (id: string) => ({ params: Promise.resolve({ id }) });
    expect((await getProduct(new Request("http://localhost"), params("1"))).status).toBe(200);
    db.update(products).set({ isPublished: false }).where(eq(products.id, 1)).run();
    expect((await getProduct(new Request("http://localhost"), params("1"))).status).toBe(404);
    expect((await getProduct(new Request("http://localhost"), params("abc"))).status).toBe(404);
  });
});
