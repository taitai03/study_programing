require "csv"

# 月別・商品別の売上CSV（経理向け）。仕様は TASK.md を参照
module MonthlySalesReport
  # 入力: 旧システムから出力した注文明細CSVの1行
  OrderLine = Data.define(:order_id, :ordered_at, :status, :product_id, :product_name, :quantity, :unit_price)

  # 入力のCSVの形が正しくないとき
  class InvalidRow < StandardError; end

  COLUMNS = %w[order_id ordered_at status product_id product_name quantity unit_price].freeze
  OUTPUT_COLUMNS = %w[month product_id product_name quantity sales].freeze

  module_function

  # 注文明細CSVの文字列を読み込み、OrderLine の配列にする
  def parse(csv_text)
    rows = CSV.parse(csv_text, skip_blanks: true)
    header, *records = rows
    raise InvalidRow, "1行目: 見出しの行が正しくありません" unless header == COLUMNS

    records.each_with_index.map do |row, i|
      line = i + 2
      raise InvalidRow, "#{line}行目: 列の数が #{row.size} です（#{COLUMNS.size} 列のはずです）" unless row.size == COLUMNS.size

      order_id, ordered_at, status, product_id, product_name, quantity, unit_price = row
      OrderLine.new(
        order_id: integer(order_id, line, "order_id"),
        ordered_at: time(ordered_at, line),
        status:,
        product_id: integer(product_id, line, "product_id"),
        product_name:,
        quantity: integer(quantity, line, "quantity"),
        unit_price: integer(unit_price, line, "unit_price")
      )
    end
  end

  # 月別・商品別に集計する。{ month:, product_id:, product_name:, quantity:, sales: } の配列を返す
  def aggregate(lines)
    lines.reject { |l| l.status == "cancelled" }
         .group_by { |l| [ l.ordered_at.in_time_zone("Tokyo").strftime("%Y-%m"), l.product_id ] }
         .map do |(month, product_id), group|
           {
             month:, product_id:, product_name: group.first.product_name,
             quantity: group.sum(&:quantity), sales: group.sum { |l| l.unit_price * l.quantity }
           }
         end
         .sort_by { |r| [ r[:month], -r[:sales], r[:product_id] ] }
  end

  # 集計結果をCSVの文字列にする
  def to_csv(rows)
    CSV.generate do |csv|
      csv << OUTPUT_COLUMNS
      rows.each { |r| csv << r.values_at(:month, :product_id, :product_name, :quantity, :sales) }
    end
  end

  # 注文明細CSVから、月別・商品別の売上CSVを作る
  def build(csv_text)
    to_csv(aggregate(parse(csv_text)))
  end

  def integer(value, line, column)
    Integer(value, 10)
  rescue ArgumentError, TypeError
    raise InvalidRow, "#{line}行目: #{column} が整数ではありません（#{value}）"
  end

  def time(value, line)
    Time.iso8601(value)
  rescue ArgumentError, TypeError
    raise InvalidRow, "#{line}行目: ordered_at が日時ではありません（#{value}）"
  end
end
