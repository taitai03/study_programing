"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import type { OrderStatus } from "@/db/schema";
import { nextStatuses } from "@/lib/order-status";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { updateOrderStatus } from "./actions";

/** 注文のステータスを変えるフォーム。いまのステータスから進めるものだけを選べる */
export function OrderStatusForm({ orderId, status }: { orderId: number; status: OrderStatus }) {
  const [state, action, pending] = useActionState(updateOrderStatus.bind(null, orderId), null);
  const options = nextStatuses(status);

  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">これ以上ステータスを変更できません</p>;
  }

  return (
    <form action={action} className="space-y-3 rounded-lg border p-4">
      <div className="flex items-end gap-3">
        <div className="w-48 space-y-1">
          <Label htmlFor="status">新しいステータス</Label>
          <Select id="status" name="status" defaultValue={options[0]}>
            {options.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "変更中…" : "変更する"}
        </Button>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-green-700">
          {state.ok}
        </p>
      )}
    </form>
  );
}
