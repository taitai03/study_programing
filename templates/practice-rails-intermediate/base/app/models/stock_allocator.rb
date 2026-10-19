# 在庫の引き当て。注文の明細の数だけ、商品の在庫を減らす
class StockAllocator
  # items: [{ product:, quantity: }]
  def initialize(items)
    @items = items
  end

  def allocate!
    @items.each do |item|
      item[:product].decrement!(:stock, item[:quantity])
    end
  end
end
