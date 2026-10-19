# 月別・商品別の売上CSV（経理向け）。仕様は TASK.md を参照
module MonthlySalesReport
  # 入力: 旧システムから出力した注文明細CSVの1行
  OrderLine = Data.define(:order_id, :ordered_at, :status, :product_id, :product_name, :quantity, :unit_price)

  # 入力のCSVの形が正しくないとき
  class InvalidRow < StandardError; end

  module_function

  # 注文明細CSVの文字列を読み込み、OrderLine の配列にする
  def parse(csv_text)
    raise NotImplementedError, "未実装です"
  end

  # 月別・商品別に集計する。{ month:, product_id:, product_name:, quantity:, sales: } の配列を返す
  def aggregate(lines)
    raise NotImplementedError, "未実装です"
  end

  # 集計結果をCSVの文字列にする
  def to_csv(rows)
    raise NotImplementedError, "未実装です"
  end

  # 注文明細CSVから、月別・商品別の売上CSVを作る
  def build(csv_text)
    to_csv(aggregate(parse(csv_text)))
  end
end
