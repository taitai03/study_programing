import { createHmac, timingSafeEqual } from "node:crypto";

/** GitHub の Webhook の署名（X-Hub-Signature-256）を検証する */
export function verifyWebhookSignature(body: string, signature: string | null, secret: string) {
  if (!signature?.startsWith("sha256=")) return false;
  const expected = Buffer.from(
    `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`,
  );
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
