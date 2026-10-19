/**
 * 決済サービス「さくらペイ」のAPIレスポンスを扱う。仕様は TASK.md を参照
 */

export type PaymentSucceeded = {
  status: "succeeded";
  paymentId: string;
  amount: number;
  paidAt: Date;
};

export type PaymentFailed = {
  status: "failed";
  paymentId: string;
  error: { code: string; message: string };
};

export type PaymentPending = {
  status: "pending";
  paymentId: string;
  /** 3Dセキュアの認証画面のURL */
  redirectUrl: string;
};

export type PaymentResult = PaymentSucceeded | PaymentFailed | PaymentPending;

/** レスポンスの形が仕様と違うときのエラー */
export class PaymentResponseError extends Error {}

/** 成功か失敗のどちらかを表す型（ジェネリクス） */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireString(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  if (typeof value !== "string") throw new PaymentResponseError(`${key} が文字列ではありません`);
  return value;
}

/** さくらペイのレスポンス（JSON をパースしたもの）を PaymentResult にする。形が違えば PaymentResponseError */
export function parsePaymentResponse(json: unknown): PaymentResult {
  if (!isObject(json)) throw new PaymentResponseError("レスポンスがオブジェクトではありません");
  const paymentId = requireString(json, "paymentId");

  switch (json.status) {
    case "succeeded": {
      if (typeof json.amount !== "number") throw new PaymentResponseError("amount が数値ではありません");
      const paidAt = new Date(requireString(json, "paidAt"));
      if (Number.isNaN(paidAt.getTime())) throw new PaymentResponseError("paidAt が日時ではありません");
      return { status: "succeeded", paymentId, amount: json.amount, paidAt };
    }
    case "failed": {
      if (!isObject(json.error)) throw new PaymentResponseError("error がありません");
      return {
        status: "failed",
        paymentId,
        error: { code: requireString(json.error, "code"), message: requireString(json.error, "message") },
      };
    }
    case "pending":
      return { status: "pending", paymentId, redirectUrl: requireString(json, "redirectUrl") };
    default:
      throw new PaymentResponseError(`知らない status です（${String(json.status)}）`);
  }
}

/** parsePaymentResponse の例外を投げない版 */
export function safeParsePaymentResponse(json: unknown): Result<PaymentResult, string> {
  try {
    return { ok: true, value: parsePaymentResponse(json) };
  } catch (e) {
    if (e instanceof PaymentResponseError) return { ok: false, error: e.message };
    throw e;
  }
}

const FAILURE_MESSAGES: Record<string, string> = {
  card_declined: "カードが利用できませんでした。別のカードをお試しください",
  insufficient_funds: "残高が不足しています",
  expired_card: "カードの有効期限が切れています",
};

/** 会員に表示するメッセージ */
export function paymentMessage(result: PaymentResult): string {
  switch (result.status) {
    case "succeeded":
      return `お支払いが完了しました（${result.amount.toLocaleString("ja-JP")}円）`;
    case "failed":
      return FAILURE_MESSAGES[result.error.code] ?? "お支払いに失敗しました。時間をおいてお試しください";
    case "pending":
      return "カード会社の認証画面で手続きを完了してください";
    default: {
      // status の種類を増やしたのに、ここを直し忘れると型エラーになる
      const unreachable: never = result;
      return unreachable;
    }
  }
}
