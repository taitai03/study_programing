import { Badge } from "@/components/ui/badge";

const STATUS = {
  passed: { label: "合格", className: "bg-green-600 text-white" },
  failed: { label: "不合格", className: "bg-red-600 text-white" },
  pending: { label: "判定待ち", className: "bg-amber-500 text-white" },
  invalid: { label: "判定対象外", className: "bg-zinc-500 text-white" },
} as const;

export type SubmissionStatus = keyof typeof STATUS;

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const s = STATUS[status];
  return <Badge className={s.className}>{s.label}</Badge>;
}

export function formatDateTime(date: Date) {
  return date.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
