import { db } from "@/db";
import { authenticateMember, errorResponse } from "@/lib/api";
import { listMemberOrders } from "@/lib/orders";

/** 会員向け: 自分の注文履歴 */
export async function GET(request: Request) {
  const member = authenticateMember(request);
  if (!member) return errorResponse(401, "APIトークンが正しくありません");

  const orders = await listMemberOrders(db, member.id);
  return Response.json({
    orders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      pointsEarned: o.pointsEarned,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    })),
  });
}
