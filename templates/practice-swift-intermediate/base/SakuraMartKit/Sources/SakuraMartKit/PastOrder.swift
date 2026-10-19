import Foundation

/// 注文のステータス
public enum OrderStatus: String, Codable, Sendable, CaseIterable {
    case pending
    case paid
    case shipped
    case completed
    case cancelled

    public var label: String {
        switch self {
        case .pending: "受付"
        case .paid: "支払済"
        case .shipped: "発送済"
        case .completed: "完了"
        case .cancelled: "キャンセル"
        }
    }
}

/// 会員の過去の注文（注文履歴の1件）
public struct PastOrder: Identifiable, Hashable, Codable, Sendable {
    public let id: Int
    public let orderedAt: Date
    public let status: OrderStatus
    /// 支払った合計（税込・送料込み）
    public let total: Int
    public let items: [PastOrderItem]

    public init(id: Int, orderedAt: Date, status: OrderStatus, total: Int, items: [PastOrderItem]) {
        self.id = id
        self.orderedAt = orderedAt
        self.status = status
        self.total = total
        self.items = items
    }
}

/// 注文の明細
public struct PastOrderItem: Hashable, Codable, Sendable {
    public let productID: Int
    public let name: String
    public let quantity: Int
    /// 注文した時点の単価（税抜）
    public let unitPrice: Int

    public init(productID: Int, name: String, quantity: Int, unitPrice: Int) {
        self.productID = productID
        self.name = name
        self.quantity = quantity
        self.unitPrice = unitPrice
    }
}

extension Calendar {
    /// 日本時間のカレンダー（日付や月の区切りに使う）
    public static let japan: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Asia/Tokyo")!
        calendar.locale = Locale(identifier: "ja_JP")
        return calendar
    }()
}
