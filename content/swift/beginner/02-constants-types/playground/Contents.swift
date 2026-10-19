let productName = "国産りんごジュース 1L"
let price = 398 // 税抜価格
let quantity = 3

// TODO: 小計（税抜）= 価格 × 数量
let subtotal = 0

// TODO: 税込金額 = 小計に消費税10%を加えた金額（端数は切り捨て）
let totalWithTax = 0

// TODO: 付与ポイント = 税込金額の1%（端数は切り捨て）
let points = 0

// TODO: ゴールド会員の付与ポイント = 税込金額の2%（端数は切り捨て）
let goldPoints = 0

// TODO: 税込金額が5,000円以上なら true
let isFreeShipping = true

// TODO: 「国産りんごジュース 1L を 3 個: 税込 1313 円（13 ポイント付与）」の形の文章を作る
let message = ""
print(message)

// MARK: - セルフチェック（ここは変更しないでください）
check("小計が 1,194 になる", subtotal, 1194)
check("税込金額が 1,313 になる", totalWithTax, 1313)
check("付与ポイントが 13 になる", points, 13)
check("ゴールド会員の付与ポイントが 26 になる", goldPoints, 26)
check("送料無料ではない", isFreeShipping, false)
check("表示する文章が正しい", message, "国産りんごジュース 1L を 3 個: 税込 1313 円（13 ポイント付与）")
