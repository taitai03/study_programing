import { z } from "zod";
import { db } from "@/db";
import { authenticateMember, authenticateStaff, errorResponse } from "@/lib/api";
import { createOrder, listOrders, OrderError } from "@/lib/orders";

const PER_PAGE = 50;

/** スタッフ向け: 注文一覧（新しい順、50件ずつ）。?page=2 で次のページ */
export async function GET(request: Request) {
  if (!(await authenticateStaff())) return errorResponse(401, "ログインしてください");

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const orders = await listOrders(db, { limit: PER_PAGE, offset: (page - 1) * PER_PAGE });
  return Response.json({
    orders: orders.map((o) => ({
      id: o.id,
      member: o.member,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
    })),
    page,
  });
}

const createOrderSchema = z.object({
  items: z
    .array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(99) }))
    .min(1),
  couponCode: z.string().trim().min(1).optional(),
});

/** 会員向け: 注文を作る */
export async function POST(request: Request) {
  const member = authenticateMember(request);
  if (!member) return errorResponse(401, "APIトークンが正しくありません");

  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, "注文の内容が正しくありません");

  try {
    const order = createOrder(db, { memberId: member.id, ...parsed.data });
    return Response.json({ order }, { status: 201 });
  } catch (e) {
    if (e instanceof OrderError) return errorResponse(400, e.message);
    throw e;
  }
}
