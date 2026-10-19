import type { Metadata } from "next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/db";
import { listMembers, RANK_LABELS } from "@/lib/members";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "会員" };

export default function MembersPage() {
  const members = listMembers(db);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-xl font-bold">会員</h1>
        <p className="text-sm text-muted-foreground">{members.length}人</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>名前</TableHead>
            <TableHead>メールアドレス</TableHead>
            <TableHead>ランク</TableHead>
            <TableHead className="text-right">ポイント</TableHead>
            <TableHead>登録日時</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{m.id}</TableCell>
              <TableCell>{m.name}</TableCell>
              <TableCell>{m.email}</TableCell>
              <TableCell>{RANK_LABELS[m.rank]}</TableCell>
              <TableCell className="text-right">{m.points.toLocaleString("ja-JP")}pt</TableCell>
              <TableCell>{formatDateTime(m.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
