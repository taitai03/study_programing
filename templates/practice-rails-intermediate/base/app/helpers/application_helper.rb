module ApplicationHelper
  # 金額を「1,234円」の形にする
  def yen(amount)
    "#{number_with_delimiter(amount)}円"
  end

  # 日時を「2026/04/01 09:30」の形にする
  def format_time(time)
    time&.strftime("%Y/%m/%d %H:%M")
  end

  def order_status_badge(order)
    tag.span(order.status_label, class: "badge badge-#{order.status}")
  end
end
