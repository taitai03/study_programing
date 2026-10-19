import type { Metadata } from "next";
import { db } from "@/db";
import { LOW_STOCK_THRESHOLD, listInventory } from "@/lib/inventory";
import { InventoryTable } from "./inventory-table";

export const metadata: Metadata = { title: "在庫" };

export default function InventoryPage() {
  const items = listInventory(db);
  const low = items.filter((i) => i.isLow).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-xl font-bold">在庫</h1>
        <p className="text-sm text-muted-foreground">
          在庫不足（{LOW_STOCK_THRESHOLD}個以下）: {low}件
        </p>
      </div>
      <InventoryTable items={items} />
    </div>
  );
}
