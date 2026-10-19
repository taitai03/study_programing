"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InventoryItem } from "@/lib/inventory";
import { receiveStockAction } from "./actions";

export function InventoryTable({ items }: { items: InventoryItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>商品名</TableHead>
          <TableHead>カテゴリ</TableHead>
          <TableHead className="text-right">在庫</TableHead>
          <TableHead />
          <TableHead>入荷登録</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <InventoryRow key={item.id} item={item} />
        ))}
      </TableBody>
    </Table>
  );
}

function InventoryRow({ item }: { item: InventoryItem }) {
  const [state, action, pending] = useActionState(receiveStockAction.bind(null, item.id), null);
  const inputId = `quantity-${item.id}`;

  return (
    <TableRow className={item.isLow ? "bg-amber-50" : undefined}>
      <TableCell>{item.id}</TableCell>
      <TableCell>{item.name}</TableCell>
      <TableCell>{item.category}</TableCell>
      <TableCell className="text-right">{item.stock}</TableCell>
      <TableCell>{item.isLow && <Badge variant="warning">在庫不足</Badge>}</TableCell>
      <TableCell>
        <form action={action} className="flex items-center gap-2">
          <label htmlFor={inputId} className="sr-only">
            {item.name}の入荷数
          </label>
          <Input id={inputId} name="quantity" type="number" min={1} max={1000} required className="w-24" />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            入荷する
          </Button>
          {state?.error && (
            <span role="alert" className="text-xs text-destructive">
              {state.error}
            </span>
          )}
          {state?.ok && (
            <span role="status" className="text-xs text-green-700">
              {state.ok}
            </span>
          )}
        </form>
      </TableCell>
    </TableRow>
  );
}
