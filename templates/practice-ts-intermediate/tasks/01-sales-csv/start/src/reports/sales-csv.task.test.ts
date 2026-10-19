// 課題のテスト（変更しないでください）
import { aggregateMonthlySales, buildMonthlySalesCsv, parseOrderLines, toCsv } from "./sales-csv";

const HEADER = "order_id,ordered_at,status,product_id,product_name,quantity,unit_price";
const input = [
  HEADER,
  "1,2026-03-31T14:59:59Z,completed,1,国産こしひかり 5kg,2,2980",
  "2,2026-03-31T15:00:00Z,completed,1,国産こしひかり 5kg,1,2980",
  "3,2026-04-02T01:00:00Z,cancelled,10,天然水 2L × 6本,5,980",
  '4,2026-04-10T01:00:00Z,shipped,44,"カタログギフト 5,000円コース",1,5500',
  "4,2026-04-10T01:00:00Z,shipped,10,天然水 2L × 6本,3,980",
  "5,2026-04-11T01:00:00Z,paid,1,国産こしひかり 5kg,1,3080",
  "",
].join("\n");

describe("parseOrderLines", () => {
  it("1行を1つの OrderLine にし、数値と日時を変換する", () => {
    const lines = parseOrderLines(input);
    expect(lines).toHaveLength(6);
    expect(lines[0]).toEqual({
      orderId: 1,
      orderedAt: new Date("2026-03-31T14:59:59Z"),
      status: "completed",
      productId: 1,
      productName: "国産こしひかり 5kg",
      quantity: 2,
      unitPrice: 2980,
    });
  });

  it("ダブルクォートで囲まれた値（カンマを含む商品名）を読める", () => {
    expect(parseOrderLines(input)[3].productName).toBe("カタログギフト 5,000円コース");
  });

  it("改行コードが CRLF でも読める", () => {
    expect(parseOrderLines(input.replaceAll("\n", "\r\n"))).toHaveLength(6);
  });

  it("列の数が合わない行や、数値でない値があれば、何行目かが分かるエラーにする", () => {
    expect(() => parseOrderLines(`${HEADER}\n1,2026-04-01T00:00:00Z,paid,1,商品,1\n`)).toThrow("2行目");
    expect(() =>
      parseOrderLines(`${HEADER}\n1,2026-04-01T00:00:00Z,paid,1,商品,1,100\n2,2026-04-01T00:00:00Z,paid,1,商品,いち,100\n`),
    ).toThrow("3行目");
  });
});

describe("aggregateMonthlySales", () => {
  const result = aggregateMonthlySales(parseOrderLines(input));

  it("日本時間の月ごと・商品ごとに、数量と売上（単価×数量）を合計する。キャンセルは含めない", () => {
    expect(result).toEqual([
      { month: "2026-03", productId: 1, productName: "国産こしひかり 5kg", quantity: 2, sales: 5960 },
      { month: "2026-04", productId: 1, productName: "国産こしひかり 5kg", quantity: 2, sales: 6060 },
      { month: "2026-04", productId: 44, productName: "カタログギフト 5,000円コース", quantity: 1, sales: 5500 },
      { month: "2026-04", productId: 10, productName: "天然水 2L × 6本", quantity: 3, sales: 2940 },
    ]);
  });

  it("売上が同じなら商品IDの小さい順", () => {
    const lines = parseOrderLines(
      [HEADER, "1,2026-04-01T00:00:00Z,paid,9,B,1,100", "2,2026-04-01T00:00:00Z,paid,3,A,1,100", ""].join("\n"),
    );
    expect(aggregateMonthlySales(lines).map((r) => r.productId)).toEqual([3, 9]);
  });

  it("明細がなければ空の配列", () => {
    expect(aggregateMonthlySales([])).toEqual([]);
  });
});

describe("toCsv", () => {
  it("見出しの行と、1件1行のCSVにする。最後の行も改行で終わる", () => {
    expect(
      toCsv([{ month: "2026-04", productId: 1, productName: "国産こしひかり 5kg", quantity: 2, sales: 6060 }]),
    ).toBe("month,product_id,product_name,quantity,sales\n2026-04,1,国産こしひかり 5kg,2,6060\n");
  });

  it("カンマやダブルクォートを含む値はダブルクォートで囲み、中のダブルクォートは2つ重ねる", () => {
    const csv = toCsv([
      { month: "2026-04", productId: 44, productName: "カタログギフト 5,000円コース", quantity: 1, sales: 5500 },
      { month: "2026-04", productId: 50, productName: '箸 "桜" 5膳', quantity: 1, sales: 1200 },
    ]);
    expect(csv.split("\n")[1]).toBe('2026-04,44,"カタログギフト 5,000円コース",1,5500');
    expect(csv.split("\n")[2]).toBe('2026-04,50,"箸 ""桜"" 5膳",1,1200');
  });

  it("0件なら見出しだけ", () => {
    expect(toCsv([])).toBe("month,product_id,product_name,quantity,sales\n");
  });
});

describe("buildMonthlySalesCsv", () => {
  it("注文明細CSVから売上CSVを作る", () => {
    expect(buildMonthlySalesCsv(input)).toBe(
      [
        "month,product_id,product_name,quantity,sales",
        "2026-03,1,国産こしひかり 5kg,2,5960",
        "2026-04,1,国産こしひかり 5kg,2,6060",
        '2026-04,44,"カタログギフト 5,000円コース",1,5500',
        "2026-04,10,天然水 2L × 6本,3,2940",
        "",
      ].join("\n"),
    );
  });
});
