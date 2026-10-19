import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/db";
import { parseId } from "@/lib/api";
import { RANK_LABELS } from "@/lib/members";
import { getOrder } from "@/lib/orders";
import { formatDateTime, yen } from "@/lib/utils";

export const metadata: Metadata = { title: "注文の詳細" };

export default async function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const id = parseId((await params).id);
  const order = id ? await getOrder(db, id) : undefined;
  if (!order) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/orders" className="text-sm text-muted-foreground hover:underline">
        ← 注文一覧
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">注文 #{order.id}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
        <dt className="text-muted-foreground">注文日時</dt>
        <dd>{formatDateTime(order.createdAt)}</dd>
        <dt className="text-muted-foreground">会員</dt>
        <dd>
          {order.member.name}（{RANK_LABELS[order.member.rank]}）
        </dd>
        <dt className="text-muted-foreground">クーポン</dt>
        <dd>{order.coupon?.code ?? "—"}</dd>
      </dl>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>商品</TableHead>
            <TableHead className="text-right">単価（税抜）</TableHead>
            <TableHead className="text-right">数量</TableHead>
            <TableHead className="text-right">金額</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.product.name}</TableCell>
              <TableCell className="text-right">{yen(item.unitPrice)}</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">{yen(item.unitPrice * item.quantity)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <dl className="ml-auto grid w-72 grid-cols-2 gap-y-1 text-sm">
        <dt>小計</dt>
        <dd className="text-right">{yen(order.subtotal)}</dd>
        <dt>会員ランク割引</dt>
        <dd className="text-right">-{yen(order.rankDiscount)}</dd>
        <dt>クーポン割引</dt>
        <dd className="text-right">-{yen(order.couponDiscount)}</dd>
        <dt>消費税</dt>
        <dd className="text-right">{yen(order.tax)}</dd>
        <dt>送料</dt>
        <dd className="text-right">{yen(order.shippingFee)}</dd>
        <dt className="border-t pt-1 font-bold">合計</dt>
        <dd className="border-t pt-1 text-right font-bold">{yen(order.total)}</dd>
        <dt className="text-muted-foreground">付与ポイント</dt>
        <dd className="text-right text-muted-foreground">{order.pointsEarned}pt</dd>
      </dl>
    </div>
  );
}
