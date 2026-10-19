"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { InventoryError, receiveStock } from "@/lib/inventory";

export type ReceiveStockState = { ok?: string; error?: string } | null;

export async function receiveStockAction(
  productId: number,
  _prev: ReceiveStockState,
  formData: FormData,
): Promise<ReceiveStockState> {
  if (!(await auth())) return { error: "ログインし直してください" };

  try {
    const stock = receiveStock(db, productId, Number(formData.get("quantity")));
    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    return { ok: `入荷を登録しました（在庫 ${stock}個）` };
  } catch (e) {
    if (e instanceof InventoryError) return { error: e.message };
    throw e;
  }
}
