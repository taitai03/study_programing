import { describe, expect, it } from "vitest";
import { runRubyInNode as run } from "./ruby-node";

describe("Ruby の実行", () => {
  it("puts と p の出力を集める", async () => {
    const r = await run(`price = 1000\nputs "価格 #{price}"\np price`);
    expect(r.logs).toEqual(["価格 1000", "1000"]);
    expect(r.error).toBeUndefined();
  });

  it("テストの合否を返す", async () => {
    const r = await run(`def add(a, b) = a + b`, [
      { name: "足し算", code: "expect(add(1, 2)).to eq(3)" },
      { name: "わざと失敗", code: "expect(add(1, 2)).to eq(4)" },
      { name: "例外", code: "expect { add(1, nil) }.to raise_error(TypeError)" },
      { name: "含む", code: `expect(["a", "b"]).to include("b")` },
    ]);
    expect(r.tests.map((t) => t.passed)).toEqual([true, false, true, true]);
    expect(r.tests[1].message).toContain("期待した値: 4");
    expect(r.tests[1].message).toContain("実際の値: 3");
  });

  it("実行時エラーに受講者のコードの行番号を付ける", async () => {
    const r = await run(`a = 1\nb = 2\nnot_defined_method(a)`);
    expect(r.error).toContain("NoMethodError");
    expect(r.error).toContain("3行目");
  });

  it("構文エラーに行番号を付ける", async () => {
    const r = await run(`a = 1\nif a > 0\n  puts a\n`);
    expect(r.error).toContain("SyntaxError");
    expect(r.error).toMatch(/\d行目/);
  });

  it("テストからトップレベルの変数と logs を参照できる", async () => {
    const r = await run(`items = [1, 2]\nputs "こんにちは"`, [
      { name: "変数", code: `expect(items.sum).to eq(3)` },
      { name: "出力", code: `expect(logs).to eq(["こんにちは"])` },
    ]);
    expect(r.tests.every((t) => t.passed)).toBe(true);
  });

  it("文字列の中の #{} や記号をそのまま渡せる", async () => {
    const r = await run(`puts "\\u0023{1} \\" ' \\\\ 🍎"\nputs "#{1 + 1}"`);
    expect(r.logs).toEqual([`#{1} " ' \\ 🍎`, "2"]);
  });
});
