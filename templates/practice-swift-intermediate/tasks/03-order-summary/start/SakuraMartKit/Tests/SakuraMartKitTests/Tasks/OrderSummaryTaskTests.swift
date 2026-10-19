// 課題のテスト（変更しないでください）
import Foundation
import Testing
@testable import SakuraMartKit

/// 日本時間の日時
private func jst(_ text: String) -> Date {
    let formatter = ISO8601DateFormatter()
    return formatter.date(from: text + "+09:00")!
}

private func order(_ id: Int, _ at: String, _ status: OrderStatus = .completed, total: Int, items: [PastOrderItem] = []) -> PastOrder {
    PastOrder(id: id, orderedAt: jst(at), status: status, total: total, items: items)
}

private let tea = { (q: Int) in PastOrderItem(productID: 11, name: "静岡煎茶 100g", quantity: q, unitPrice: 1080) }
private let rice = { (q: Int) in PastOrderItem(productID: 1, name: "国産こしひかり 5kg", quantity: q, unitPrice: 2980) }
private let water = { (q: Int) in PastOrderItem(productID: 10, name: "天然水 2L × 6本", quantity: q, unitPrice: 980) }

private let orders = [
    order(1, "2026-03-31T23:59:59", total: 3000, items: [tea(1)]),
    order(2, "2026-04-01T00:00:00", total: 5000, items: [rice(1), tea(2)]),
    order(3, "2026-04-10T12:00:00", .cancelled, total: 9999, items: [water(9)]),
    order(4, "2026-04-20T12:00:00", .shipped, total: 1500, items: [water(1), tea(1)]),
    order(5, "2026-02-14T12:00:00", total: 6500, items: [rice(2)]),
]

@Suite("注文履歴の集計")
struct OrderSummaryTaskTests {
    @Test("月別の合計: キャンセルを除き、日本時間の月ごとに件数と合計を出す。合計の多い順")
    func monthlyTotals() {
        #expect(OrderSummary.monthlyTotals(orders) == [
            MonthlyTotal(month: "2026-04", orderCount: 2, total: 6500),
            MonthlyTotal(month: "2026-02", orderCount: 1, total: 6500),
            MonthlyTotal(month: "2026-03", orderCount: 1, total: 3000),
        ])
    }

    @Test("月別の合計: 合計が同じなら新しい月が先。注文がなければ空")
    func monthlyTotalsTie() {
        #expect(OrderSummary.monthlyTotals(orders).prefix(2).map(\.month) == ["2026-04", "2026-02"])
        #expect(OrderSummary.monthlyTotals([]).isEmpty)
    }

    @Test("よく買う商品: キャンセルを除いて数量を合計し、多い順に limit 件。数量が同じなら商品IDの小さい順")
    func topProducts() {
        #expect(OrderSummary.topProducts(orders, limit: 2) == [
            ProductQuantity(productID: 11, name: "静岡煎茶 100g", quantity: 4),
            ProductQuantity(productID: 1, name: "国産こしひかり 5kg", quantity: 3),
        ])
        #expect(OrderSummary.topProducts(orders, limit: 10).map(\.productID) == [11, 1, 10])
    }

    @Test("注文番号の入力から、番号だけを取り出す（数字でないものは無視する）")
    func orderIDs() {
        #expect(OrderSummary.parseOrderIDs(["#123", " 456 ", "abc", "", "#", "78"]) == [123, 456, 78])
    }

    @Test("Sequence の grouped(by:) はどんな型の要素とキーでも使える（ジェネリクス）")
    func grouped() {
        let words = ["apple", "avocado", "banana", "blueberry", "cherry"]
        let byInitial: [Character: [String]] = words.grouped { $0.first! }
        #expect(byInitial["a"] == ["apple", "avocado"])
        #expect(byInitial["b"] == ["banana", "blueberry"])
        let byParity: [Bool: [Int]] = [1, 2, 3, 4, 5].grouped { $0 % 2 == 0 }
        #expect(byParity[true] == [2, 4])
    }

    @Test("Sequence の sum(of:) は、Int でも Double でも合計できる（ジェネリクス）")
    func sum() {
        #expect(orders.sum { $0.total } == 25999)
        #expect([0.5, 1.25].sum { $0 } == 1.75)
        #expect([String]().sum { $0.count } == 0)
    }
}
