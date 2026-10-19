func rankDiscountRate(rank: String) -> Int {
    switch rank {
    case "gold":
        return 10
    case "silver":
        return 5
    default:
        return 0
    }
}

func shippingFee(totalWithTax: Int) -> Int {
    if totalWithTax >= 5000 {
        return 0
    }
    return 550
}

func canAcceptOrder(stock: Int, quantity: Int) -> Bool {
    return stock >= quantity && (1...10).contains(quantity)
}

func amountAfterRankDiscount(subtotal: Int, rank: String) -> Int {
    return subtotal - subtotal * rankDiscountRate(rank: rank) / 100
}

check("ゴールド会員の割引率が 10", rankDiscountRate(rank: "gold"), 10)
check("シルバー会員の割引率が 5", rankDiscountRate(rank: "silver"), 5)
check("一般会員の割引率が 0", rankDiscountRate(rank: "general"), 0)
check("税込4,999円の送料が550円", shippingFee(totalWithTax: 4999), 550)
check("税込5,000円の送料が0円", shippingFee(totalWithTax: 5000), 0)
check("在庫5個に3個の注文は受け付ける", canAcceptOrder(stock: 5, quantity: 3), true)
check("在庫5個に6個の注文は受け付けない", canAcceptOrder(stock: 5, quantity: 6), false)
check("0個の注文は受け付けない", canAcceptOrder(stock: 100, quantity: 0), false)
check("11個の注文は受け付けない", canAcceptOrder(stock: 100, quantity: 11), false)
check("ちょうど10個の注文は受け付ける", canAcceptOrder(stock: 10, quantity: 10), true)
check("シルバー会員の2,100円はランク割引後1,995円", amountAfterRankDiscount(subtotal: 2100, rank: "silver"), 1995)
check("ゴールド会員の10,000円はランク割引後9,000円", amountAfterRankDiscount(subtotal: 10000, rank: "gold"), 9000)
