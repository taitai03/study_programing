import Foundation

/// クーポン（1注文につき1枚）
public struct Coupon: Hashable, Sendable {
    public enum Discount: Hashable, Sendable {
        /// 定額（円）
        case fixed(Int)
        /// 定率（%）
        case percent(Int)
    }

    public let code: String
    public let discount: Discount
    /// ランク割引のあとの金額で判定する
    public let minAmount: Int
    public let startsAt: Date
    public let endsAt: Date

    public init(code: String, discount: Discount, minAmount: Int = 0, startsAt: Date, endsAt: Date) {
        self.code = code
        self.discount = discount
        self.minAmount = minAmount
        self.startsAt = startsAt
        self.endsAt = endsAt
    }

    /// 割引額を返す。amount はランク割引のあとの金額（税抜）。使えなければ CouponError
    public func discountAmount(for amount: Int, now: Date) throws -> Int {
        if now < startsAt { throw CouponError.notStarted }
        if now > endsAt { throw CouponError.expired }
        if amount < minAmount { throw CouponError.belowMinimum(minAmount) }

        let value = switch discount {
        case .fixed(let yen): yen
        case .percent(let percent): amount * percent / 100
        }
        // 割引で金額がマイナスにならないようにする
        return min(value, amount)
    }
}

/// クーポンが使えない理由
public enum CouponError: Error, Equatable, LocalizedError {
    case notStarted
    case expired
    case belowMinimum(Int)

    public var errorDescription: String? {
        switch self {
        case .notStarted: "クーポンの利用期間前です"
        case .expired: "クーポンの利用期間が終わっています"
        case .belowMinimum(let amount): "クーポンは\(formatYen(amount))以上の購入で使えます"
        }
    }
}
