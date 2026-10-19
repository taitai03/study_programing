import { and, asc, eq, or, type SQL, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { categories, products } from "@/db/schema";

export function listCategories(db: Db) {
  return db.select().from(categories).orderBy(asc(categories.id)).all();
}

/** 商品一覧（管理画面用。非公開の商品も含む） */
export function listProducts(db: Db) {
  return db.query.products.findMany({
    with: { category: true },
    orderBy: [asc(products.id)],
  });
}

export type ProductSearch = {
  /** 空白（全角を含む）で区切った複数のキーワード。すべてを商品名か説明に含むものだけ */
  q?: string;
  categoryId?: number;
};

/** 文字列を含むか（大文字・小文字は区別しない）。LIKE と違い、% や _ もその文字として扱う */
function contains(column: typeof products.name | typeof products.description, keyword: string) {
  return sql`instr(lower(${column}), ${keyword.toLowerCase()}) > 0`;
}

/** 管理画面の商品検索（非公開の商品も含む） */
export function searchProducts(db: Db, { q = "", categoryId }: ProductSearch) {
  const keywords = q.split(/[\s　]+/).filter(Boolean);
  const conditions: SQL[] = keywords.map(
    (kw) => or(contains(products.name, kw), contains(products.description, kw))!,
  );
  if (categoryId) conditions.push(eq(products.categoryId, categoryId));

  return db.query.products.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: { category: true },
    orderBy: [asc(products.id)],
  });
}

/** 公開中の商品（会員向けAPI用） */
export function listPublishedProducts(db: Db) {
  return db.query.products.findMany({
    where: eq(products.isPublished, true),
    with: { category: true },
    orderBy: [asc(products.id)],
  });
}

export function getProduct(db: Db, id: number) {
  return db.query.products.findFirst({ where: eq(products.id, id), with: { category: true } });
}

/** 管理画面の商品編集フォームの入力 */
export const productInputSchema = z.object({
  name: z.string().trim().min(1, "商品名を入力してください").max(100, "商品名は100文字以内にしてください"),
  description: z.string().trim().max(1000, "説明は1000文字以内にしてください"),
  price: z.coerce
    .number({ error: "価格は数字で入力してください" })
    .int("価格は整数で入力してください")
    .min(1, "価格は1円以上にしてください")
    .max(1_000_000, "価格は100万円以下にしてください"),
  categoryId: z.coerce.number().int(),
  isPublished: z.boolean(),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export function updateProduct(db: Db, id: number, input: ProductInput) {
  return db
    .update(products)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning()
    .get();
}

/** 会員向けAPIで返す形（社内向けの項目を含めない） */
export function toPublicProduct(p: Awaited<ReturnType<typeof listPublishedProducts>>[number]) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category.name,
  };
}
