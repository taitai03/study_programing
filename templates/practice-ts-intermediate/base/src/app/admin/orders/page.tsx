import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/db";
import { countOrders, listOrders } from "@/lib/orders";
import { formatDateTime, yen } from "@/lib/utils";

export const metadata: Metadata = { title: "注文" };

const PER_PAGE = 50;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const { page: pageParam } = await searchParams;
  const total = await countOrders(db);
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), lastPage);
  const orders = await listOrders(db, { limit: PER_PAGE, offset: (page - 1) * PER_PAGE });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-xl font-bold">注文</h1>
        <p className="text-sm text-muted-foreground">{total}件</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>注文番号</TableHead>
            <TableHead>会員</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead className="text-right">合計</TableHead>
            <TableHead>注文日時</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline">
                  #{o.id}
                </Link>
              </TableCell>
              <TableCell>{o.member.name}</TableCell>
              <TableCell>
                <OrderStatusBadge status={o.status} />
              </TableCell>
              <TableCell className="text-right">{yen(o.total)}</TableCell>
              <TableCell>{formatDateTime(o.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <nav className="flex items-center justify-center gap-4 text-sm">
        {page > 1 && <Link href={`/admin/orders?page=${page - 1}`} className="text-primary hover:underline">← 前へ</Link>}
        <span className="text-muted-foreground">
          {page} / {lastPage}
        </span>
        {page < lastPage && <Link href={`/admin/orders?page=${page + 1}`} className="text-primary hover:underline">次へ →</Link>}
      </nav>
    </div>
  );
}
