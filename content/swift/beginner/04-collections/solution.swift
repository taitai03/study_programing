typealias Line = (orderId: Int, status: String, productName: String, unitPrice: Int, quantity: Int)

let todayLines: [Line] = [
    (orderId: 1, status: "paid", productName: "国産りんごジュース 1L", unitPrice: 398, quantity: 3),
    (orderId: 1, status: "paid", productName: "ふっくら食パン", unitPrice: 248, quantity: 2),
    (orderId: 2, status: "shipped", productName: "竹のまな板", unitPrice: 1980, quantity: 1),
    (orderId: 2, status: "shipped", productName: "天然水 2L", unitPrice: 128, quantity: 6),
    (orderId: 3, status: "cancelled", productName: "国産りんごジュース 1L", unitPrice: 398, quantity: 10),
    (orderId: 4, status: "delivered", productName: "天然水 2L", unitPrice: 128, quantity: 4),
    (orderId: 4, status: "delivered", productName: "ボールペン 3本セット", unitPrice: 330, quantity: 2),
    (orderId: 5, status: "pending", productName: "国産りんごジュース 1L", unitPrice: 398, quantity: 1),
    (orderId: 5, status: "pending", productName: "ふっくら食パン", unitPrice: 248, quantity: 1),
    (orderId: 5, status: "pending", productName: "食器用スポンジ", unitPrice: 198, quantity: 2),
]

func totalSales(_ lines: [Line]) -> Int {
    var total = 0
    for line in lines {
        if line.status == "cancelled" {
            continue
        }
        total += line.unitPrice * line.quantity
    }
    return total
}

func quantityByProduct(_ lines: [Line]) -> [String: Int] {
    var counts: [String: Int] = [:]
    for line in lines where line.status != "cancelled" {
        counts[line.productName, default: 0] += line.quantity
    }
    return counts
}

func orderCount(_ lines: [Line]) -> Int {
    var orderIds: [Int] = []
    for line in lines {
        if line.status != "cancelled" && !orderIds.contains(line.orderId) {
            orderIds.append(line.orderId)
        }
    }
    return orderIds.count
}

// MARK: - セルフチェック（ここは変更しないでください）
check("今日の売上が 6,652 円になる", totalSales(todayLines), 6652)
check("天然水 2L の販売数が 10", quantityByProduct(todayLines)["天然水 2L"], 10)
check("国産りんごジュース 1L の販売数が 4", quantityByProduct(todayLines)["国産りんごジュース 1L"], 4)
check("販売された商品が 6 種類", quantityByProduct(todayLines).count, 6)
check("キャンセルを除いた注文が 4 件", orderCount(todayLines), 4)
check("明細が0行のときの売上は 0", totalSales([]), 0)
check("明細が0行のときの販売数は空", quantityByProduct([]), [:])
check("明細が0行のときの件数は 0", orderCount([]), 0)
