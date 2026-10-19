# 在庫を持つもの（stock 属性があるもの）に include する
module Stockable
  # 在庫がこの数以下なら在庫不足
  LOW_STOCK_THRESHOLD = 10

  def in_stock?(quantity = 1)
    stock >= quantity
  end

  def low_stock?
    stock <= LOW_STOCK_THRESHOLD
  end
end
