import type { TrackingClient, TrackingStatus } from "./client";

/**
 * 複数の荷物の追跡状況をまとめて取得する。仕様は TASK.md を参照
 */

export type TrackingResult =
  | { trackingNumber: string; ok: true; status: TrackingStatus }
  | { trackingNumber: string; ok: false; reason: "not_found" | "timeout" | "error" };

export type FetchTrackingOptions = {
  /** 1回の呼び出しの制限時間（ミリ秒） */
  timeoutMs?: number;
  /** 失敗したときに、やり直す回数 */
  retries?: number;
};

export async function fetchTrackingStatuses(
  trackingNumbers: string[],
  client: TrackingClient,
  options: FetchTrackingOptions = {},
): Promise<TrackingResult[]> {
  throw new Error("未実装です");
}
