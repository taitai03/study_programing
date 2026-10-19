func couponDiscount(amount: Int, type: String, value: Int, minPurchase: Int = 0) -> Int {
    if amount < minPurchase {
        return 0
    }
    switch type {
    case "amount":
        return min(value, amount)
    case "percent":
        return amount * value / 100
    default:
        return 0
    }
}

func couponAvailableProducts(_ products: [(name: String, price: Int)], budget: Int) -> [String] {
    products
        .filter { $0.price * 110 / 100 <= budget }
        .map { $0.name }
}

// MARK: - セルフチェック（ここは変更しないでください）
let products: [(name: String, price: Int)] = [
    (name: "国産りんごジュース 1L", price: 398),
    (name: "ふっくら食パン", price: 248),
    (name: "竹のまな板", price: 1980),
    (name: "天然水 2L", price: 128),
    (name: "大学ノート 5冊セット", price: 455),
]
check("3,000円に500円引き（2,000円以上）", couponDiscount(amount: 3000, type: "amount", value: 500, minPurchase: 2000), 500)
check("1,500円には500円引き（2,000円以上）は使えない", couponDiscount(amount: 1500, type: "amount", value: 500, minPurchase: 2000), 0)
check("ちょうど2,000円なら使える", couponDiscount(amount: 2000, type: "amount", value: 500, minPurchase: 2000), 500)
check("300円に500円引きは300円まで", couponDiscount(amount: 300, type: "amount", value: 500), 300)
check("3,333円に10%引きは333円", couponDiscount(amount: 3333, type: "percent", value: 10), 333)
check("知らない種類のクーポンでは割引しない", couponDiscount(amount: 3000, type: "free_shipping", value: 10), 0)
check("予算500円で買える商品（税込ちょうど500円も含む）", couponAvailableProducts(products, budget: 500), ["国産りんごジュース 1L", "ふっくら食パン", "天然水 2L", "大学ノート 5冊セット"])
check("予算100円で買える商品はない", couponAvailableProducts(products, budget: 100), [])
