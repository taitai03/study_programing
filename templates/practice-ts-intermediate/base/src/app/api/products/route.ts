import { db } from "@/db";
import { listPublishedProducts, toPublicProduct } from "@/lib/products";

/** 会員向け: 公開中の商品一覧 */
export async function GET() {
  const products = await listPublishedProducts(db);
  return Response.json({ products: products.map(toPublicProduct) });
}
