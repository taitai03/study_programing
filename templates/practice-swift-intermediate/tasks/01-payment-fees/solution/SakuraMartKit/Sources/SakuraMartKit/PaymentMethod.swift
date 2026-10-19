/// 支払い方法。手数料の計算は支払い方法ごとに違う
public protocol PaymentMethod: Sendable {
    /// 画面に表示する名前
    var name: String { get }
    /// 支払える金額の上限（円）。上限がなければ nil
    var maxAmount: Int? { get }
    /// 手数料（円）。amount は送料を含む支払い金額
    func fee(for amount: Int) -> Int
}

// どの支払い方法にも共通の処理は、プロトコルの拡張に書く
extension PaymentMethod {
    /// 上限がない支払い方法は、書かなくてよい
    public var maxAmount: Int? { nil }

    /// この支払い方法で払えるか
    public func canPay(_ amount: Int) -> Bool {
        guard amount > 0 else { return false }
        guard let maxAmount else { return true }
        return amount <= maxAmount
    }

    /// 手数料を足した支払い金額
    public func totalWithFee(for amount: Int) -> Int {
        amount + fee(for: amount)
    }
}

/// クレジットカード。手数料はかからない
public struct CreditCardPayment: PaymentMethod {
    public let name = "クレジットカード"

    public init() {}

    public func fee(for amount: Int) -> Int { 0 }
}

/// コンビニ払い。1万円未満は220円、1万円以上は330円。30万円まで
public struct ConvenienceStorePayment: PaymentMethod {
    public let name = "コンビニ払い"
    public let maxAmount: Int? = 300_000

    public init() {}

    public func fee(for amount: Int) -> Int {
        amount < 10_000 ? 220 : 330
    }
}

/// 後払い。手数料は一律330円。5万5千円まで
public struct DeferredPayment: PaymentMethod {
    public let name = "後払い"
    public let maxAmount: Int? = 55_000

    public init() {}

    public func fee(for amount: Int) -> Int { 330 }
}

/// アプリで選べる支払い方法
public enum PaymentOptions {
    public static let all: [any PaymentMethod] = [CreditCardPayment(), ConvenienceStorePayment(), DeferredPayment()]

    /// その金額で使える支払い方法
    public static func available(for amount: Int) -> [any PaymentMethod] {
        all.filter { $0.canPay(amount) }
    }
}
