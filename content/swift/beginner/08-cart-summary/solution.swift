// MARK: - 用意されている型（変更しないでください）

struct Product {
    let name: String
    let price: Int // 税抜
}

struct CartItem {
    let product: Product
    let quantity: Int
}

struct Coupon {
    enum Kind {
        case amount  // 定額（value 円引き）
        case percent // 定率（value %引き）
    }
    let kind: Kind
    let value: Int
    let minPurchase: Int // 最低購入金額（ランク割引のあとの金額で判定する）
}

enum MemberRank {
    case general, silver, gold

    var discountRate: Int {
        switch self {
        case .general: return 0
        case .silver: return 5
        case .gold: return 10
        }
    }

    var pointRate: Int {
        self == .gold ? 2 : 1
    }
}

struct CheckoutSummary: Equatable {
    let subtotal: Int
    let rankDiscount: Int
    let couponDiscount: Int
    let tax: Int
    let shippingFee: Int
    let total: Int
    let points: Int
}

func couponDiscount(_ coupon: Coupon?, amount: Int) -> Int {
    guard let coupon, amount >= coupon.minPurchase else {
        return 0
    }
    switch coupon.kind {
    case .amount:
        return min(coupon.value, amount)
    case .percent:
        return amount * coupon.value / 100
    }
}

func checkout(items: [CartItem], rank: MemberRank, coupon: Coupon?) -> CheckoutSummary {
    let subtotal = items.map { $0.product.price * $0.quantity }.reduce(0, +)
    let rankDiscount = subtotal * rank.discountRate / 100
    let afterRank = subtotal - rankDiscount
    let couponAmount = couponDiscount(coupon, amount: afterRank)
    let discounted = afterRank - couponAmount
    let tax = discounted * 10 / 100
    let withTax = discounted + tax
    let shippingFee = items.isEmpty || withTax >= 5000 ? 0 : 550
    return CheckoutSummary(
        subtotal: subtotal,
        rankDiscount: rankDiscount,
        couponDiscount: couponAmount,
        tax: tax,
        shippingFee: shippingFee,
        total: withTax + shippingFee,
        points: withTax * rank.pointRate / 100
    )
}

// MARK: - セルフチェック（ここは変更しないでください）
let juice = Product(name: "国産りんごジュース 1L", price: 398)
let bread = Product(name: "ふっくら食パン", price: 248)
let board = Product(name: "竹のまな板", price: 1980)
let water = Product(name: "天然水 2L", price: 128)

check(
    "一般会員・クーポンなし",
    checkout(items: [CartItem(product: juice, quantity: 3), CartItem(product: bread, quantity: 2)], rank: .general, coupon: nil),
    CheckoutSummary(subtotal: 1690, rankDiscount: 0, couponDiscount: 0, tax: 169, shippingFee: 550, total: 2409, points: 18)
)
check(
    "ゴールド会員が10%引き（3,000円以上）のクーポンを使う",
    checkout(
        items: [CartItem(product: board, quantity: 2), CartItem(product: water, quantity: 6)],
        rank: .gold,
        coupon: Coupon(kind: .percent, value: 10, minPurchase: 3000)
    ),
    CheckoutSummary(subtotal: 4728, rankDiscount: 472, couponDiscount: 425, tax: 383, shippingFee: 550, total: 4764, points: 84)
)
check(
    "シルバー会員が500円引き（5,000円以上）のクーポンを使い、送料無料になる",
    checkout(items: [CartItem(product: board, quantity: 3)], rank: .silver, coupon: Coupon(kind: .amount, value: 500, minPurchase: 5000)),
    CheckoutSummary(subtotal: 5940, rankDiscount: 297, couponDiscount: 500, tax: 514, shippingFee: 0, total: 5657, points: 56)
)
check(
    "ランク割引のあとで最低購入金額に届かないと、クーポンは使えない",
    checkout(
        items: [CartItem(product: juice, quantity: 4), CartItem(product: bread, quantity: 2)],
        rank: .silver,
        coupon: Coupon(kind: .amount, value: 300, minPurchase: 2000)
    ),
    CheckoutSummary(subtotal: 2088, rankDiscount: 104, couponDiscount: 0, tax: 198, shippingFee: 550, total: 2732, points: 21)
)
check(
    "かごが空なら、すべて 0",
    checkout(items: [], rank: .gold, coupon: nil),
    CheckoutSummary(subtotal: 0, rankDiscount: 0, couponDiscount: 0, tax: 0, shippingFee: 0, total: 0, points: 0)
)
