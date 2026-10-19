// 課題のテスト（変更しないでください）
import {
  type PaymentResult,
  PaymentResponseError,
  paymentMessage,
  parsePaymentResponse,
  safeParsePaymentResponse,
} from "./payment";

const succeeded = { status: "succeeded", paymentId: "pay_001", amount: 2750, paidAt: "2026-04-15T03:00:00Z" };
const failed = {
  status: "failed",
  paymentId: "pay_002",
  error: { code: "card_declined", message: "Your card was declined." },
};
const pending = { status: "pending", paymentId: "pay_003", redirectUrl: "https://pay.example.com/3ds/abc" };

describe("parsePaymentResponse", () => {
  it("成功: paidAt を Date にする", () => {
    const r = parsePaymentResponse(succeeded);
    expect(r).toEqual({ status: "succeeded", paymentId: "pay_001", amount: 2750, paidAt: new Date("2026-04-15T03:00:00Z") });
    // status で絞り込むと、成功のときだけある項目を型安全に使える
    if (r.status === "succeeded") {
      expectTypeOf(r.paidAt).toEqualTypeOf<Date>();
      expectTypeOf(r.amount).toEqualTypeOf<number>();
    }
  });

  it("失敗: エラーのコードとメッセージを持つ", () => {
    const r = parsePaymentResponse(failed);
    expect(r).toEqual(failed);
    if (r.status === "failed") expectTypeOf(r.error.code).toEqualTypeOf<string>();
  });

  it("保留（3Dセキュアの認証待ち）: 認証画面のURLを持つ", () => {
    const r = parsePaymentResponse(pending);
    expect(r).toEqual(pending);
    if (r.status === "pending") expectTypeOf(r.redirectUrl).toEqualTypeOf<string>();
  });

  it("status の種類は3つだけ（型でも表す）", () => {
    expectTypeOf<PaymentResult["status"]>().toEqualTypeOf<"succeeded" | "failed" | "pending">();
  });

  it.each([
    ["null", null],
    ["文字列", "succeeded"],
    ["知らない status", { ...succeeded, status: "refunded" }],
    ["amount が数値でない", { ...succeeded, amount: "2750" }],
    ["paidAt が日時でない", { ...succeeded, paidAt: "yesterday" }],
    ["paymentId がない", { status: "pending", redirectUrl: "https://pay.example.com" }],
    ["error がない", { status: "failed", paymentId: "pay_002" }],
    ["error.code が文字列でない", { ...failed, error: { code: 1, message: "x" } }],
  ])("形が違うレスポンス（%s）は PaymentResponseError", (_, json) => {
    expect(() => parsePaymentResponse(json)).toThrow(PaymentResponseError);
  });
});

describe("safeParsePaymentResponse", () => {
  it("例外を投げずに、成功なら value、失敗なら error（メッセージ）を返す", () => {
    const ok = safeParsePaymentResponse(succeeded);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.status).toBe("succeeded");

    const ng = safeParsePaymentResponse({ status: "unknown" });
    expect(ng.ok).toBe(false);
    if (!ng.ok) expectTypeOf(ng.error).toEqualTypeOf<string>();
  });
});

describe("paymentMessage", () => {
  it("成功: 金額を3桁区切りで表示する", () => {
    expect(paymentMessage(parsePaymentResponse({ ...succeeded, amount: 12800 }))).toBe(
      "お支払いが完了しました（12,800円）",
    );
  });

  it.each([
    ["card_declined", "カードが利用できませんでした。別のカードをお試しください"],
    ["insufficient_funds", "残高が不足しています"],
    ["expired_card", "カードの有効期限が切れています"],
    ["processing_error", "お支払いに失敗しました。時間をおいてお試しください"],
  ])("失敗（%s）: コードごとのメッセージ。知らないコードは共通のメッセージ", (code, message) => {
    expect(paymentMessage(parsePaymentResponse({ ...failed, error: { code, message: "x" } }))).toBe(message);
  });

  it("保留: 認証の手続きを案内する", () => {
    expect(paymentMessage(parsePaymentResponse(pending))).toBe(
      "カード会社の認証画面で手続きを完了してください",
    );
  });
});
