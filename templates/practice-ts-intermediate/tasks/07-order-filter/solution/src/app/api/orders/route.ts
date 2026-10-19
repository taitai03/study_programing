import { z } from "zod";
import { db } from "@/db";
import { authenticateMember, authenticateStaff, errorResponse } from "@/lib/api";
import { ORDER_STATUSES } from "@/db/schema";
import { createOrder, listOrders, OrderError } from "@/lib/orders";

const PER_PAGE = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 日本時間の日付（YYYY-MM-DD）の0時を、UTC の Date にする */
const jstDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日付は YYYY-MM-DD の形式で指定してください")
  .transform((value, ctx) => {
    const date = new Date(`${value}T00:00:00+09:00`);
    // 2026-02-30 のような存在しない日付は、Date にすると別の日にずれるので弾く
    if (Number.isNaN(date.getTime()) || new Date(date.getTime() + 9 * 3600_000).toISOString().slice(0, 10) !== value) {
      ctx.addIssue({ code: "custom", message: `${value} は存在しない日付です` });
      return z.NEVER;
    }
    return date;
  });

const listQuerySchema = z
  .object({
    from: jstDate.optional(),
    to: jstDate.optional(),
    status: z.enum(ORDER_STATUSES, { error: `status は ${ORDER_STATUSES.join(" / ")} のどれかを指定してください` }).optional(),
    page: z.coerce.number().int().min(1).catch(1),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: "from は to 以前の日付にしてください" });

/**
 * スタッフ向け: 注文一覧（新しい順、50件ずつ）。?page=2 で次のページ
 * ?from=2026-04-01&to=2026-04-15（日本時間、両端を含む）、?status=paid で絞り込める
 */
export async function GET(request: Request) {
  if (!(await authenticateStaff())) return errorResponse(401, "ログインしてください");

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = listQuerySchema.safeParse(params);
  if (!parsed.success) return errorResponse(400, parsed.error.issues[0].message);

  const { from, to, status, page } = parsed.data;
  const orders = await listOrders(db, {
    from,
    // to の日も含めるため、翌日の0時より前を条件にする
    until: to ? new Date(to.getTime() + DAY_MS) : undefined,
    status,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });
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
