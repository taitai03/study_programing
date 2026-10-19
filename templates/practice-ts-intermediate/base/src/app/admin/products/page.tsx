import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/db";
import { listProducts } from "@/lib/products";
import { yen } from "@/lib/utils";

export const metadata: Metadata = { title: "商品" };

export default async function ProductsPage() {
  const products = await listProducts(db);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-xl font-bold">商品</h1>
        <p className="text-sm text-muted-foreground">{products.length}件</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>商品名</TableHead>
            <TableHead>カテゴリ</TableHead>
            <TableHead className="text-right">価格（税抜）</TableHead>
            <TableHead>公開</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.id}</TableCell>
              <TableCell>
                <Link href={`/admin/products/${p.id}`} className="text-primary hover:underline">
                  {p.name}
                </Link>
              </TableCell>
              <TableCell>{p.category.name}</TableCell>
              <TableCell className="text-right">{yen(p.price)}</TableCell>
              <TableCell>
                {p.isPublished ? <Badge variant="success">公開</Badge> : <Badge variant="secondary">非公開</Badge>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
