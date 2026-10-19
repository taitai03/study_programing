// 課題のテスト（変更しないでください）
import { eq } from "drizzle-orm";
import { products } from "@/db/schema";
import { db } from "@/test/db";
import { searchProducts } from "./products";

const names = async (...args: Parameters<typeof searchProducts>) =>
  (await searchProducts(...args)).map((p) => p.name);

describe("searchProducts", () => {
  it("条件がなければ、すべての商品（非公開を含む）をID順に返す", async () => {
    const all = await searchProducts(db, {});
    expect(all).toHaveLength(50);
    expect(all.map((p) => p.id)).toEqual([...all.map((p) => p.id)].sort((a, b) => a - b));
    expect(all[0].category.name).toBe("食品");
  });

  it("キーワードは商品名か説明に含まれていれば一致する（部分一致）", async () => {
    expect(await names(db, { q: "ティッシュ" })).toEqual(["ボックスティッシュ 5箱", "ウェットティッシュ 3個パック"]);
    db.update(products).set({ description: "限定のティッシュケース付き" }).where(eq(products.id, 1)).run();
    expect(await names(db, { q: "ティッシュ" })).toContain("国産こしひかり 5kg");
  });

  it("空白で区切った複数のキーワードは、すべてを含むものだけ（全角の空白も区切りとみなす）", async () => {
    expect(await names(db, { q: "茶 ティーバッグ" })).toEqual(["ほうじ茶 ティーバッグ 50袋", "麦茶 ティーバッグ 54袋"]);
    expect(await names(db, { q: "茶　54袋" })).toEqual(["麦茶 ティーバッグ 54袋"]);
  });

  it("英字の大文字・小文字は区別しない", async () => {
    expect(await names(db, { q: "a4" })).toEqual(["クリアファイル A4 20枚"]);
  });

  it("% や _ は、その文字そのものとして検索する", async () => {
    expect(await names(db, { q: "%" })).toEqual([]);
    expect(await names(db, { q: "_" })).toEqual([]);
  });

  it("カテゴリで絞り込める。キーワードと組み合わせられる", async () => {
    const drinks = await searchProducts(db, { categoryId: 2 });
    expect(drinks).toHaveLength(8);
    expect(drinks.every((p) => p.category.name === "飲料")).toBe(true);
    expect(await names(db, { q: "茶", categoryId: 2 })).toEqual([
      "静岡煎茶 100g",
      "ほうじ茶 ティーバッグ 50袋",
      "麦茶 ティーバッグ 54袋",
    ]);
    expect(await names(db, { q: "茶", categoryId: 6 })).toEqual(["日本茶 飲み比べセット"]);
  });

  it("キーワードが空白だけなら、条件なしと同じ", async () => {
    expect(await searchProducts(db, { q: "  　" })).toHaveLength(50);
  });
});
