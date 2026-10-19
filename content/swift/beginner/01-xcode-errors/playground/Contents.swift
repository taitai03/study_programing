// 送料を計算するプログラム（どこかが壊れています）
// 実行して、エラーメッセージを手がかりに直してください。

let shippingFee = 550
let freeShippingThreshold = 5000

func calcShippingFee(_ total: Int) -> Int {
    if total >= freeShippingThreshold {
        return 0
    }
    return shipingFee
}

func shippingMessage(_ total: Int) -> String {
    return "\(total)円の注文の送料: " + calcShippingFee(total) + "円"
}

print(calcShippingFee(3000))
print(calcShipingFee(5000))
print(shippingMessage(3000))

// MARK: - セルフチェック（ここは変更しないでください）
// 実行すると、下のデバッグエリアに結果が表示されます。すべて ✅ になれば完成です。
check("3,000円の注文の送料が550円になる", calcShippingFee(3000), 550)
check("5,000円の注文の送料が0円になる", calcShippingFee(5000), 0)
check("4,999円の注文の送料が550円になる", calcShippingFee(4999), 550)
check("案内の文章が正しい", shippingMessage(3000), "3000円の注文の送料: 550円")
