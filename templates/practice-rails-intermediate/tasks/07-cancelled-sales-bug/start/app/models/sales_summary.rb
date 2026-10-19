# 売上ダッシュボードの集計。キャンセルの注文は含めない（業務仕様 3.2）
class SalesSummary
  def initialize(now: Time.current)
    @now = now
  end

  # 今日の売上（合計金額の合計）と件数
  def today
    summarize(Order.for_sales.where(ordered_at: @now.all_day))
  end

  # 今月の売上と件数
  def this_month
    summarize(Order.ordered_in(@now.all_month))
  end

  # 直近 days 日間の、日ごとの売上と件数
  def daily(days: 7)
    range = (@now.to_date - (days - 1))..@now.to_date
    orders = Order.ordered_in(range.first.beginning_of_day..@now.end_of_day)
    by_day = orders.group_by { |o| o.ordered_at.to_date }
    range.map { |day| { day:, **summarize(by_day.fetch(day, [])) } }
  end

  # 今月よく売れた商品（数量の多い順）
  def top_products(limit: 5)
    OrderItem.joins(:order, :product)
             .merge(Order.for_sales.where(ordered_at: @now.all_month))
             .group("products.id", "products.name")
             .order(Arel.sql("SUM(order_items.quantity) DESC"), "products.id")
             .limit(limit)
             .pluck("products.name", Arel.sql("SUM(order_items.quantity)"))
             .map { |name, quantity| { name:, quantity: } }
  end

  private
    def summarize(orders)
      { sales: orders.sum(&:total), count: orders.size }
    end
end
