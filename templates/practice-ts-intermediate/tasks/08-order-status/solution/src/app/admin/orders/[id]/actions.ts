"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { ORDER_STATUSES } from "@/db/schema";
import { changeOrderStatus } from "@/lib/order-status";
import { ORDER_STATUS_LABELS } from "@/lib/orders";

export type OrderStatusFormState = { ok?: string; error?: string } | null;

export async function updateOrderStatus(
  orderId: number,
  _prev: OrderStatusFormState,
  formData: FormData,
): Promise<OrderStatusFormState> {
  if (!(await auth())) return { error: "ログインし直してください" };

  const status = ORDER_STATUSES.find((s) => s === formData.get("status"));
  if (!status) return { error: "ステータスを選んでください" };

  const result = changeOrderStatus(db, orderId, status);
  if (!result.ok) return { error: result.error };

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: `ステータスを「${ORDER_STATUS_LABELS[status]}」に変更しました` };
}
