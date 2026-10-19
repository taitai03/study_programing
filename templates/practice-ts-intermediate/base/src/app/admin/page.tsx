import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/db";
import { listOrders, ORDER_STATUS_LABELS } from "@/lib/orders";
import { dailySales } from "@/lib/sales";
import { formatDateTime, yen } from "@/lib/utils";

export const metadata: Metadata = { title: "ダッシュボード" };

export default async function DashboardPage() {
  const days = dailySales(db, new Date());
  const today = days[days.length - 1];
  const recent = await listOrders(db, { limit: 10 });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">ダッシュボード</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>今日の売上</CardTitle>
          <p className="mt-2 text-2xl font-bold">{yen(today.sales)}</p>
        </Card>
        <Card>
          <CardTitle>今日の注文</CardTitle>
          <p className="mt-2 text-2xl font-bold">{today.count}件</p>
        </Card>
        <Card>
          <CardTitle>直近7日の売上</CardTitle>
          <p className="mt-2 text-2xl font-bold">{yen(days.reduce((s, d) => s + d.sales, 0))}</p>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">日ごとの売上（キャンセルを除く）</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日付</TableHead>
              <TableHead className="text-right">売上</TableHead>
              <TableHead className="text-right">件数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map((d) => (
              <TableRow key={d.day}>
                <TableCell>{d.day}</TableCell>
                <TableCell className="text-right">{yen(d.sales)}</TableCell>
                <TableCell className="text-right">{d.count}件</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">最近の注文</h2>
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
            {recent.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline">
                    #{o.id}
                  </Link>
                </TableCell>
                <TableCell>{o.member.name}</TableCell>
                <TableCell>{ORDER_STATUS_LABELS[o.status]}</TableCell>
                <TableCell className="text-right">{yen(o.total)}</TableCell>
                <TableCell>{formatDateTime(o.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
