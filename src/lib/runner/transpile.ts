import { transform } from "sucrase";

/** TypeScript の型を取り除いて JavaScript にする（型チェックはしない）。行番号は元のコードと変わらない */
export function transpile(code: string): { js: string } | { error: string } {
  try {
    return {
      js: transform(code, { transforms: ["typescript"], disableESTransforms: true }).code,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // sucrase のエラーは "Unexpected token (3:5)" の形で位置を持っている
    const m = /\((\d+):(\d+)\)/.exec(message);
    const where = m ? `（${m[1]}行目）` : "";
    return { error: `SyntaxError: ${message.replace(/\s*\(\d+:\d+\)/, "")}${where}` };
  }
}
