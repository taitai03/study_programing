import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABELS } from "@/lib/orders";

const VARIANTS = {
  pending: "warning",
  paid: "default",
  shipped: "secondary",
  completed: "success",
  cancelled: "outline",
} as const;

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANTS[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
