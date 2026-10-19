import Foundation

/// 月別の注文の合計
public struct MonthlyTotal: Equatable, Sendable {
    /// 日本時間の年月（例: "2026-04"）
    public let month: String
    public let orderCount: Int
    public let total: Int

    public init(month: String, orderCount: Int, total: Int) {
        self.month = month
        self.orderCount = orderCount
        self.total = total
    }
}

/// 商品ごとの購入数
public struct ProductQuantity: Equatable, Sendable {
    public let productID: Int
    public let name: String
    public let quantity: Int

    public init(productID: Int, name: String, quantity: Int) {
        self.productID = productID
        self.name = name
        self.quantity = quantity
    }
}

/// 注文履歴の集計（マイページの「お買い物のまとめ」）
public enum OrderSummary {
    /// キャンセルを除いた月別の件数と合計。合計の多い順（同じなら新しい月が先）
    public static func monthlyTotals(_ orders: [PastOrder], calendar: Calendar = .japan) -> [MonthlyTotal] {
        let byMonth = orders
            .filter { $0.status != .cancelled }
            .grouped { monthKey($0.orderedAt, calendar: calendar) }
        let totals: [MonthlyTotal] = byMonth.map { month, orders in
            MonthlyTotal(month: month, orderCount: orders.count, total: orders.sum { $0.total })
        }
        return totals.sorted { ($0.total, $0.month) > ($1.total, $1.month) }
    }

    /// キャンセルを除いて、よく買う商品を数量の多い順に limit 件（同じなら商品IDの小さい順）
    public static func topProducts(_ orders: [PastOrder], limit: Int) -> [ProductQuantity] {
        // 長い式は型の推論に時間がかかるので、途中の結果に型を付けて分ける
        let items: [PastOrderItem] = orders.filter { $0.status != .cancelled }.flatMap(\.items)
        let quantities: [ProductQuantity] = items.grouped(by: \.productID).map { id, items in
            ProductQuantity(productID: id, name: items[0].name, quantity: items.sum { $0.quantity })
        }
        let sorted = quantities.sorted { a, b in
            a.quantity != b.quantity ? a.quantity > b.quantity : a.productID < b.productID
        }
        return Array(sorted.prefix(limit))
    }

    /// 入力された注文番号（"#123" や " 456 "）から番号を取り出す。番号でないものは無視する
    public static func parseOrderIDs(_ inputs: [String]) -> [Int] {
        inputs.compactMap { input in
            let text = input.trimmingCharacters(in: .whitespaces)
            return Int(text.hasPrefix("#") ? String(text.dropFirst()) : text)
        }
    }

    private static func monthKey(_ date: Date, calendar: Calendar) -> String {
        let components = calendar.dateComponents([.year, .month], from: date)
        return String(format: "%04d-%02d", components.year!, components.month!)
    }
}

extension Sequence {
    /// キーごとに要素をまとめる（順番は元のまま）
    public func grouped<Key: Hashable>(by key: (Element) -> Key) -> [Key: [Element]] {
        Dictionary(grouping: self, by: key)
    }

    /// 要素から取り出した数値の合計
    public func sum<Value: AdditiveArithmetic>(of value: (Element) -> Value) -> Value {
        reduce(.zero) { $0 + value($1) }
    }
}
