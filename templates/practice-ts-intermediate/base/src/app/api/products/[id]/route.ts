import { db } from "@/db";
import { errorResponse, parseId } from "@/lib/api";
import { getProduct, toPublicProduct } from "@/lib/products";

/** 会員向け: 商品の詳細（非公開の商品は見つからない扱い） */
export async function GET(_request: Request, ctx: RouteContext<"/api/products/[id]">) {
  const id = parseId((await ctx.params).id);
  const product = id ? await getProduct(db, id) : undefined;
  if (!product?.isPublished) return errorResponse(404, "商品が見つかりません");
  return Response.json({ product: toPublicProduct(product) });
}
