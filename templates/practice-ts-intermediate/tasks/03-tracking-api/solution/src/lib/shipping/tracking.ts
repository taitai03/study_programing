import { type TrackingClient, TrackingApiError, type TrackingStatus } from "./client";

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

class TimeoutError extends Error {}

/** 制限時間つきで1回呼び出す。時間を過ぎたら signal を中断して TimeoutError を投げる */
async function callWithTimeout(client: TrackingClient, trackingNumber: string, timeoutMs: number) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError());
    }, timeoutMs);
  });
  try {
    return await Promise.race([client.getStatus(trackingNumber, controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** やり直してよい失敗か（制限時間切れと、500番台のエラー） */
function isRetryable(e: unknown) {
  return e instanceof TimeoutError || (e instanceof TrackingApiError && e.httpStatus >= 500);
}

async function fetchOne(
  client: TrackingClient,
  trackingNumber: string,
  timeoutMs: number,
  retries: number,
): Promise<TrackingResult> {
  for (let attempt = 0; ; attempt++) {
    try {
      const status = await callWithTimeout(client, trackingNumber, timeoutMs);
      return { trackingNumber, ok: true, status };
    } catch (e) {
      if (isRetryable(e) && attempt < retries) continue;
      if (e instanceof TrackingApiError && e.httpStatus === 404) {
        return { trackingNumber, ok: false, reason: "not_found" };
      }
      return { trackingNumber, ok: false, reason: e instanceof TimeoutError ? "timeout" : "error" };
    }
  }
}

export async function fetchTrackingStatuses(
  trackingNumbers: string[],
  client: TrackingClient,
  { timeoutMs = 3000, retries = 2 }: FetchTrackingOptions = {},
): Promise<TrackingResult[]> {
  // fetchOne は例外を投げないので、Promise.all で1件の失敗がほかに影響しない
  return Promise.all(trackingNumbers.map((n) => fetchOne(client, n, timeoutMs, retries)));
}
