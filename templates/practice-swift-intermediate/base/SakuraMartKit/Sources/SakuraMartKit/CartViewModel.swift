import Foundation
import Observation

/// カートの画面のロジック
@MainActor
@Observable
public final class CartViewModel {
    public private(set) var cart = Cart()
    public var rank: MemberRank
    public private(set) var coupon: Coupon?

    private let now: () -> Date

    public init(rank: MemberRank = .regular, now: @escaping () -> Date = Date.init) {
        self.rank = rank
        self.now = now
    }

    public func add(_ product: Product, quantity: Int = 1) {
        cart.add(product, quantity: quantity)
    }

    public func setQuantity(_ quantity: Int, for productID: Int) {
        cart.setQuantity(quantity, for: productID)
    }

    public func remove(productID: Int) {
        cart.remove(productID: productID)
    }

    public func apply(_ coupon: Coupon?) {
        self.coupon = coupon
    }

    /// 料金の内訳。クーポンが使えないときは、クーポンなしで計算する（理由は couponError）
    public var breakdown: PriceBreakdown {
        do {
            return try PriceCalculator.calculate(items: cart.items, rank: rank, coupon: coupon, now: now())
        } catch {
            // クーポン以外では失敗しない
            return (try? PriceCalculator.calculate(items: cart.items, rank: rank, now: now()))!
        }
    }

    /// クーポンが使えないときの理由
    public var couponError: String? {
        guard let coupon else { return nil }
        do {
            _ = try PriceCalculator.calculate(items: cart.items, rank: rank, coupon: coupon, now: now())
            return nil
        } catch {
            return (error as? LocalizedError)?.errorDescription
        }
    }
}
