import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 金額を「1,234円」の形にする */
export function yen(amount: number) {
  return `${amount.toLocaleString("ja-JP")}円`;
}

/** 日時を日本時間で「2026/04/01 09:30」の形にする */
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
