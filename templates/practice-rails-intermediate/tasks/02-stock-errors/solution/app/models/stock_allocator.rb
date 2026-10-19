# 在庫の引き当て。注文の明細の数だけ、商品の在庫を減らす
class StockAllocator
  # 在庫が足りないとき。足りない商品と、注文した数・在庫の数を持つ
  class InsufficientStockError < StandardError
    attr_reader :product, :requested, :available

    def initialize(product:, requested:, available:)
      @product = product
      @requested = requested
      @available = available
      super("「#{product.name}」の在庫が足りません（注文: #{requested}個、在庫: #{available}個）")
    end
  end

  # items: [{ product:, quantity: }]
  def initialize(items)
    @items = items
  end

  # すべての商品の在庫が足りることを確かめてから減らす。1つでも足りなければ、何も減らさずに例外を投げる
  def allocate!
    quantities = @items.each_with_object(Hash.new(0)) { |item, sums| sums[item[:product]] += item[:quantity] }

    quantities.each do |product, quantity|
      unless product.in_stock?(quantity)
        raise InsufficientStockError.new(product:, requested: quantity, available: product.stock)
      end
    end
    quantities.each { |product, quantity| product.decrement!(:stock, quantity) }
  end
end
