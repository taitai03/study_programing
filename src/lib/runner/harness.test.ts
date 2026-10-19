import { describe, expect, it } from "vitest";
import { buildProgram, runProgram } from "./harness";
import { transpile } from "./transpile";

async function run(code: string, tests: { name: string; code: string }[] = []) {
  const t = transpile(code);
  if ("error" in t) return { logs: [], error: t.error, tests: [] };
  return runProgram(buildProgram(t.js, tests));
}

describe("runProgram", () => {
  it("console.log の出力を集める", async () => {
    const r = await run(`const price: number = 1000;\nconsole.log("価格", price);`);
    expect(r.logs).toEqual(["価格 1000"]);
    expect(r.error).toBeUndefined();
  });

  it("テストの合否を返す", async () => {
    const r = await run(`function add(a: number, b: number) { return a + b; }`, [
      { name: "足し算", code: "expect(add(1, 2)).toBe(3);" },
      { name: "わざと失敗", code: "expect(add(1, 2)).toBe(4);" },
    ]);
    expect(r.tests.map((t) => t.passed)).toEqual([true, false]);
    expect(r.tests[1].message).toContain("期待した値: 4");
  });

  it("実行時エラーに受講者のコードの行番号を付ける", async () => {
    const r = await run(`const a = 1;\nconst b = 2;\nnotDefined();`);
    expect(r.error).toContain("ReferenceError");
    expect(r.error).toContain("3行目");
  });

  it("構文エラーに行番号を付ける", async () => {
    const r = await run(`const a = 1;\nconst = 2;`);
    expect(r.error).toContain("SyntaxError");
    expect(r.error).toContain("2行目");
  });

  it("テストから logs を参照できる", async () => {
    const r = await run(`console.log("こんにちは");`, [
      { name: "出力", code: `expect(logs).toContain("こんにちは");` },
    ]);
    expect(r.tests[0].passed).toBe(true);
  });
});
