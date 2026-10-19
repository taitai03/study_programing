# 注文を作る。金額を計算して保存し、在庫を引き当て、付与したポイントを会員に足す
class OrderCreator
  # 注文を作れなかった理由（会員向けAPIで 422 として返す）
  class Error < StandardError; end

  # items: [{ product_id:, quantity: }]
  def self.call(member:, items:, coupon_code: nil, now: Time.current)
    new(member:, items:, coupon_code:, now:).call
  end

  def initialize(member:, items:, coupon_code:, now:)
    @member = member
    @items = items
    @coupon_code = coupon_code
    @now = now
  end

  def call
    raise Error, "商品を1つ以上選んでください" if @items.empty?
    if @items.any? { |i| !i[:quantity].is_a?(Integer) || i[:quantity] < 1 }
      raise Error, "数量は1以上の整数で指定してください"
    end

    Order.transaction do
      lines = build_lines
      pricing = calculate(lines)
      StockAllocator.new(lines.map { |l| { product: l[:product], quantity: l[:quantity] } }).allocate!

      order = Order.create!(
        member: @member, coupon:, status: "pending", ordered_at: @now,
        subtotal: pricing.subtotal, rank_discount: pricing.rank_discount, coupon_discount: pricing.coupon_discount,
        tax: pricing.tax, shipping_fee: pricing.shipping_fee, total: pricing.total, points_earned: pricing.points
      )
      lines.each do |l|
        order.items.create!(product: l[:product], quantity: l[:quantity], unit_price: l[:product].price)
      end
      @member.increment!(:points, pricing.points)
      order
    end
  end

  private
    def build_lines
      ids = @items.map { |i| i[:product_id] }.uniq
      products = Product.published.where(id: ids).index_by(&:id)
      missing = ids - products.keys
      raise Error, "購入できない商品があります（ID: #{missing.join(', ')}）" if missing.any?

      @items.map { |i| { product: products.fetch(i[:product_id]), quantity: i[:quantity] } }
    end

    def coupon
      return nil if @coupon_code.blank?

      @coupon ||= Coupon.find_by(code: @coupon_code) || raise(Error, "クーポンが見つかりません")
    end

    def calculate(lines)
      Pricing.calculate(
        items: lines.map { |l| { unit_price: l[:product].price, quantity: l[:quantity] } },
        rank: @member.rank, coupon:, now: @now
      )
    rescue Coupon::NotApplicable => e
      raise Error, e.message
    end
end
