import Foundation

/// 料金の内訳（円）
public struct PriceBreakdown: Equatable, Sendable {
    public let subtotal: Int
    public let rankDiscount: Int
    public let couponDiscount: Int
    public let tax: Int
    public let shippingFee: Int
    public let total: Int
    public let points: Int
}

/// 注文の金額を計算する（業務仕様 3.3）。端数はすべて切り捨て
/// 1. 小計 → 2. 会員ランク割引 → 3. クーポン割引 → 4. 消費税 → 5. 送料 → 6. 合計
public enum PriceCalculator {
    public static let taxRate = 10
    public static let shippingFee = 550
    public static let freeShippingThreshold = 5_000

    public static func rankDiscountRate(for rank: MemberRank) -> Int {
        switch rank {
        case .regular: 0
        case .silver: 5
        case .gold: 10
        }
    }

    public static func calculate(
        items: [CartItem], rank: MemberRank, coupon: Coupon? = nil, now: Date = Date()
    ) throws -> PriceBreakdown {
        let subtotal = items.reduce(0) { $0 + $1.amount }
        let rankDiscount = subtotal * rankDiscountRate(for: rank) / 100
        let afterRank = subtotal - rankDiscount

        let couponDiscount = try coupon?.discountAmount(for: afterRank, now: now) ?? 0
        let discounted = afterRank - couponDiscount

        let tax = discounted * taxRate / 100
        let taxIncluded = discounted + tax
        let shipping = taxIncluded >= freeShippingThreshold || items.isEmpty ? 0 : shippingFee

        return PriceBreakdown(
            subtotal: subtotal,
            rankDiscount: rankDiscount,
            couponDiscount: couponDiscount,
            tax: tax,
            shippingFee: shipping,
            total: taxIncluded + shipping,
            points: PointCalculator.points(taxIncluded: taxIncluded, rank: rank)
        )
    }
}
