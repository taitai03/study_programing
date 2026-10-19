import Foundation
import Testing
@testable import SakuraMartKit

private let now = Date(timeIntervalSince1970: 1_776_222_000) // 2026-04-15 12:00（日本時間）

private func product(price: Int, id: Int = 1) -> Product {
    Product(id: id, name: "商品\(id)", description: "", price: price, category: "食品")
}

@Suite("料金計算")
struct PriceCalculatorTests {
    @Test("一般会員: 小計に消費税を足し、5,000円未満なら送料550円")
    func regular() throws {
        let result = try PriceCalculator.calculate(items: [CartItem(product: product(price: 1000), quantity: 2)], rank: .regular, now: now)
        #expect(result == PriceBreakdown(subtotal: 2000, rankDiscount: 0, couponDiscount: 0, tax: 200, shippingFee: 550, total: 2750, points: 22))
    }

    @Test("税込でちょうど5,000円なら送料無料")
    func freeShipping() throws {
        let result = try PriceCalculator.calculate(items: [CartItem(product: product(price: 4546), quantity: 1)], rank: .regular, now: now)
        #expect(result.tax == 454)
        #expect(result.shippingFee == 0)
        #expect(result.total == 5000)
    }

    @Test("ゴールド会員: 10%引き、ポイントは2%")
    func gold() throws {
        let result = try PriceCalculator.calculate(items: [CartItem(product: product(price: 3333), quantity: 3)], rank: .gold, now: now)
        #expect(result.subtotal == 9999)
        #expect(result.rankDiscount == 999)
        #expect(result.total == 9900)
        #expect(result.points == 198)
    }

    @Test("クーポンはランク割引のあとの金額に適用し、最低購入金額もランク割引のあとで判定する")
    func coupon() throws {
        let coupon = Coupon(code: "TEST", discount: .percent(10), minAmount: 2850,
                            startsAt: now.addingTimeInterval(-86_400), endsAt: now.addingTimeInterval(86_400))
        let result = try PriceCalculator.calculate(items: [CartItem(product: product(price: 3000), quantity: 1)], rank: .silver, coupon: coupon, now: now)
        #expect(result.rankDiscount == 150)
        #expect(result.couponDiscount == 285)
        #expect(result.total == 2565 + 256 + 550)
    }

    @Test("最低購入金額に届かないクーポンはエラー")
    func couponBelowMinimum() {
        let coupon = Coupon(code: "TEST", discount: .fixed(500), minAmount: 3000,
                            startsAt: now.addingTimeInterval(-86_400), endsAt: now.addingTimeInterval(86_400))
        #expect(throws: CouponError.belowMinimum(3000)) {
            try PriceCalculator.calculate(items: [CartItem(product: product(price: 3000), quantity: 1)], rank: .silver, coupon: coupon, now: now)
        }
    }

    @Test("カートが空なら送料はかからない")
    func empty() throws {
        #expect(try PriceCalculator.calculate(items: [], rank: .regular, now: now).total == 0)
    }
}
