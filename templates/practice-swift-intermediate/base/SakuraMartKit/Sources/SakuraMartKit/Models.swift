import Foundation

/// 会員ランク
public enum MemberRank: String, Codable, Sendable, CaseIterable {
    case regular
    case silver
    case gold

    public var label: String {
        switch self {
        case .regular: "一般"
        case .silver: "シルバー"
        case .gold: "ゴールド"
        }
    }
}

/// 商品。価格は税抜（円）
public struct Product: Identifiable, Hashable, Codable, Sendable {
    public let id: Int
    public let name: String
    public let description: String
    public let price: Int
    /// カテゴリ名（食品、飲料、日用品、キッチン用品、文具、ギフト）
    public let category: String

    public init(id: Int, name: String, description: String, price: Int, category: String) {
        self.id = id
        self.name = name
        self.description = description
        self.price = price
        self.category = category
    }
}

/// 金額を「1,234円」の形にする
public func formatYen(_ amount: Int) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .decimal
    formatter.locale = Locale(identifier: "ja_JP")
    return "\(formatter.string(from: NSNumber(value: amount)) ?? String(amount))円"
}
