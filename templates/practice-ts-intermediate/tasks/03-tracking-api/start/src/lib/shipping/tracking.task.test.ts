// 課題のテスト（変更しないでください）
import { type TrackingClient, TrackingApiError, type TrackingStatus } from "./client";
import { fetchTrackingStatuses } from "./tracking";

const ok = (trackingNumber: string): TrackingStatus => ({
  trackingNumber,
  status: "delivered",
  updatedAt: "2026-04-15T03:00:00Z",
});

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    });
  });

/** 呼び出しごとの動きを決められるクライアント。呼び出しの記録も取る */
function fakeClient(behave: (trackingNumber: string, attempt: number, signal: AbortSignal) => Promise<TrackingStatus>) {
  const calls: string[] = [];
  let running = 0;
  let maxRunning = 0;
  const client: TrackingClient = {
    async getStatus(trackingNumber, signal) {
      const attempt = calls.filter((c) => c === trackingNumber).length + 1;
      calls.push(trackingNumber);
      running++;
      maxRunning = Math.max(maxRunning, running);
      try {
        return await behave(trackingNumber, attempt, signal);
      } finally {
        running--;
      }
    },
  };
  return { client, calls, maxRunning: () => maxRunning };
}

describe("fetchTrackingStatuses", () => {
  it("すべての荷物の状況を、渡した順番で返す", async () => {
    const { client } = fakeClient(async (n, _a, signal) => {
      await sleep(n === "A" ? 30 : 5, signal);
      return ok(n);
    });
    const results = await fetchTrackingStatuses(["A", "B", "C"], client);
    expect(results).toEqual([
      { trackingNumber: "A", ok: true, status: ok("A") },
      { trackingNumber: "B", ok: true, status: ok("B") },
      { trackingNumber: "C", ok: true, status: ok("C") },
    ]);
  });

  it("1件ずつ順番に待たずに、並列で問い合わせる", async () => {
    const fake = fakeClient(async (n, _a, signal) => {
      await sleep(50, signal);
      return ok(n);
    });
    const started = Date.now();
    await fetchTrackingStatuses(["A", "B", "C", "D"], fake.client);
    expect(fake.maxRunning()).toBe(4);
    expect(Date.now() - started).toBeLessThan(180);
  });

  it("404 は not_found。やり直さない", async () => {
    const fake = fakeClient(async () => {
      throw new TrackingApiError(404);
    });
    expect(await fetchTrackingStatuses(["X"], fake.client)).toEqual([
      { trackingNumber: "X", ok: false, reason: "not_found" },
    ]);
    expect(fake.calls).toEqual(["X"]);
  });

  it("500番台のエラーは、retries 回までやり直す。成功すればその結果を使う", async () => {
    const fake = fakeClient(async (n, attempt) => {
      if (attempt < 3) throw new TrackingApiError(503);
      return ok(n);
    });
    expect(await fetchTrackingStatuses(["A"], fake.client, { retries: 2 })).toEqual([
      { trackingNumber: "A", ok: true, status: ok("A") },
    ]);
    expect(fake.calls).toEqual(["A", "A", "A"]);
  });

  it("やり直しても失敗したら error。やり直しの回数は省略すると2回", async () => {
    const fake = fakeClient(async () => {
      throw new TrackingApiError(500);
    });
    expect(await fetchTrackingStatuses(["A"], fake.client)).toEqual([
      { trackingNumber: "A", ok: false, reason: "error" },
    ]);
    expect(fake.calls).toHaveLength(3);
  });

  it("400番台（404 以外）は error。やり直さない", async () => {
    const fake = fakeClient(async () => {
      throw new TrackingApiError(401);
    });
    expect(await fetchTrackingStatuses(["A"], fake.client)).toEqual([
      { trackingNumber: "A", ok: false, reason: "error" },
    ]);
    expect(fake.calls).toHaveLength(1);
  });

  it("制限時間を過ぎたら中断（abort）してやり直し、それでも応答がなければ timeout", async () => {
    let aborted = 0;
    const fake = fakeClient(
      (_n, _a, signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            aborted++;
            reject(new Error("aborted"));
          });
        }),
    );
    const started = Date.now();
    expect(await fetchTrackingStatuses(["A"], fake.client, { timeoutMs: 30, retries: 1 })).toEqual([
      { trackingNumber: "A", ok: false, reason: "timeout" },
    ]);
    expect(fake.calls).toHaveLength(2);
    expect(aborted).toBe(2);
    expect(Date.now() - started).toBeLessThan(500);
  });

  it("1件の失敗が、ほかの荷物の結果に影響しない", async () => {
    const fake = fakeClient(async (n) => {
      if (n === "B") throw new TrackingApiError(404);
      if (n === "C") throw new Error("network error");
      return ok(n);
    });
    expect(await fetchTrackingStatuses(["A", "B", "C"], fake.client, { retries: 0 })).toEqual([
      { trackingNumber: "A", ok: true, status: ok("A") },
      { trackingNumber: "B", ok: false, reason: "not_found" },
      { trackingNumber: "C", ok: false, reason: "error" },
    ]);
  });

  it("追跡番号が空なら、問い合わせずに空の配列を返す", async () => {
    const fake = fakeClient(async (n) => ok(n));
    expect(await fetchTrackingStatuses([], fake.client)).toEqual([]);
    expect(fake.calls).toEqual([]);
  });
});
