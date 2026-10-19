/**
 * 決済サービス「さくらペイ」のAPIレスポンスを扱う。仕様は TASK.md を参照
 */

// TODO: さくらペイのレスポンスを型で表す（成功・失敗・保留）
export type PaymentResult = unknown;

/** レスポンスの形が仕様と違うときのエラー */
export class PaymentResponseError extends Error {}

/** 成功か失敗のどちらかを表す型（ジェネリクス） */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** さくらペイのレスポンス（JSON をパースしたもの）を PaymentResult にする。形が違えば PaymentResponseError */
export function parsePaymentResponse(json: unknown): PaymentResult {
  throw new Error("未実装です");
}

/** parsePaymentResponse の例外を投げない版 */
export function safeParsePaymentResponse(json: unknown): Result<PaymentResult, string> {
  throw new Error("未実装です");
}

/** 会員に表示するメッセージ */
export function paymentMessage(result: PaymentResult): string {
  throw new Error("未実装です");
}
