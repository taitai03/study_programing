# 課題のテスト（変更しないでください）
require "rails_helper"

RSpec.describe MonthlySalesReport do
  header = "order_id,ordered_at,status,product_id,product_name,quantity,unit_price"
  input = [
    header,
    "1,2026-03-31T14:59:59Z,completed,1,国産こしひかり 5kg,2,2980",
    "2,2026-03-31T15:00:00Z,completed,1,国産こしひかり 5kg,1,2980",
    "3,2026-04-02T01:00:00Z,cancelled,10,天然水 2L × 6本,5,980",
    '4,2026-04-10T01:00:00Z,shipped,44,"カタログギフト 5,000円コース",1,5500',
    "4,2026-04-10T01:00:00Z,shipped,10,天然水 2L × 6本,3,980",
    "5,2026-04-11T01:00:00Z,paid,1,国産こしひかり 5kg,1,3080",
    ""
  ].join("\n")

  describe ".parse" do
    it "1行を1つの OrderLine にし、数値と日時を変換する" do
      lines = described_class.parse(input)
      expect(lines.size).to eq(6)
      expect(lines.first).to have_attributes(
        order_id: 1, status: "completed", product_id: 1, product_name: "国産こしひかり 5kg", quantity: 2, unit_price: 2980
      )
      expect(lines.first.ordered_at).to eq(Time.utc(2026, 3, 31, 14, 59, 59))
    end

    it "ダブルクォートで囲まれた値（カンマを含む商品名）を読める" do
      expect(described_class.parse(input)[3].product_name).to eq("カタログギフト 5,000円コース")
    end

    it "改行コードが CRLF でも読める" do
      expect(described_class.parse(input.gsub("\n", "\r\n")).size).to eq(6)
    end

    it "列の数が合わない行や、数値でない値があれば、何行目かが分かるエラーにする" do
      expect { described_class.parse("#{header}\n1,2026-04-01T00:00:00Z,paid,1,商品,1\n") }
        .to raise_error(MonthlySalesReport::InvalidRow, /2行目/)
      expect { described_class.parse("#{header}\n1,2026-04-01T00:00:00Z,paid,1,商品,1,100\n2,2026-04-01T00:00:00Z,paid,1,商品,いち,100\n") }
        .to raise_error(MonthlySalesReport::InvalidRow, /3行目/)
    end
  end

  describe ".aggregate" do
    it "日本時間の月ごと・商品ごとに、数量と売上（単価×数量）を合計する。キャンセルは含めない" do
      expect(described_class.aggregate(described_class.parse(input))).to eq([
        { month: "2026-03", product_id: 1, product_name: "国産こしひかり 5kg", quantity: 2, sales: 5960 },
        { month: "2026-04", product_id: 1, product_name: "国産こしひかり 5kg", quantity: 2, sales: 6060 },
        { month: "2026-04", product_id: 44, product_name: "カタログギフト 5,000円コース", quantity: 1, sales: 5500 },
        { month: "2026-04", product_id: 10, product_name: "天然水 2L × 6本", quantity: 3, sales: 2940 }
      ])
    end

    it "売上が同じなら商品IDの小さい順" do
      lines = described_class.parse([ header, "1,2026-04-01T00:00:00Z,paid,9,B,1,100", "2,2026-04-01T00:00:00Z,paid,3,A,1,100", "" ].join("\n"))
      expect(described_class.aggregate(lines).map { |r| r[:product_id] }).to eq([ 3, 9 ])
    end

    it "明細がなければ空の配列" do
      expect(described_class.aggregate([])).to eq([])
    end
  end

  describe ".to_csv" do
    it "見出しの行と、1件1行のCSVにする。最後の行も改行で終わる" do
      csv = described_class.to_csv([ { month: "2026-04", product_id: 1, product_name: "国産こしひかり 5kg", quantity: 2, sales: 6060 } ])
      expect(csv).to eq("month,product_id,product_name,quantity,sales\n2026-04,1,国産こしひかり 5kg,2,6060\n")
    end

    it "カンマやダブルクォートを含む値はダブルクォートで囲み、中のダブルクォートは2つ重ねる" do
      csv = described_class.to_csv([
        { month: "2026-04", product_id: 44, product_name: "カタログギフト 5,000円コース", quantity: 1, sales: 5500 },
        { month: "2026-04", product_id: 50, product_name: '箸 "桜" 5膳', quantity: 1, sales: 1200 }
      ])
      expect(csv.lines[1]).to eq(%(2026-04,44,"カタログギフト 5,000円コース",1,5500\n))
      expect(csv.lines[2]).to eq(%(2026-04,50,"箸 ""桜"" 5膳",1,1200\n))
    end

    it "0件なら見出しだけ" do
      expect(described_class.to_csv([])).to eq("month,product_id,product_name,quantity,sales\n")
    end
  end

  describe ".build" do
    it "注文明細CSVから売上CSVを作る" do
      expect(described_class.build(input)).to eq(<<~CSV)
        month,product_id,product_name,quantity,sales
        2026-03,1,国産こしひかり 5kg,2,5960
        2026-04,1,国産こしひかり 5kg,2,6060
        2026-04,44,"カタログギフト 5,000円コース",1,5500
        2026-04,10,天然水 2L × 6本,3,2940
      CSV
    end
  end
end
