/**
 * 配送業者「はやぶさ便」の追跡API。
 * 本番では HTTP で呼び出す。開発中とテストでは createMockTrackingClient を使う
 */

export type TrackingStatus = {
  trackingNumber: string;
  /** in_transit: 配送中、delivered: 配達済み、returned: 返送 */
  status: "in_transit" | "delivered" | "returned";
  /** 状態が最後に変わった日時（ISO 8601） */
  updatedAt: string;
};

/** APIがエラーを返したとき（HTTP のステータスコードを持つ） */
export class TrackingApiError extends Error {
  constructor(
    readonly httpStatus: number,
    message = `追跡APIがエラーを返しました（${httpStatus}）`,
  ) {
    super(message);
  }
}

export interface TrackingClient {
  /**
   * 1件の追跡状況を取得する。
   * signal が中断（abort）されたら、通信をやめて例外を投げる
   */
  getStatus(trackingNumber: string, signal: AbortSignal): Promise<TrackingStatus>;
}

/** 本番の追跡API */
export function createHttpTrackingClient(baseUrl: string, apiKey: string): TrackingClient {
  return {
    async getStatus(trackingNumber, signal) {
      const res = await fetch(`${baseUrl}/v1/tracking/${encodeURIComponent(trackingNumber)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal,
      });
      if (!res.ok) throw new TrackingApiError(res.status);
      return (await res.json()) as TrackingStatus;
    },
  };
}

/** 開発用のモック。追跡番号の末尾で動きを変える（…404: 見つからない、…500: エラー、…999: 応答しない） */
export function createMockTrackingClient(delayMs = 100): TrackingClient {
  return {
    getStatus(trackingNumber, signal) {
      return new Promise((resolve, reject) => {
        if (trackingNumber.endsWith("999")) return; // 応答しない
        const timer = setTimeout(() => {
          if (trackingNumber.endsWith("404")) reject(new TrackingApiError(404));
          else if (trackingNumber.endsWith("500")) reject(new TrackingApiError(500));
          else resolve({ trackingNumber, status: "in_transit", updatedAt: new Date().toISOString() });
        }, delayMs);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(signal.reason);
        });
      });
    },
  };
}
