let productName = "国産りんごジュース 1L"
let price = 398 // 税抜価格
let quantity = 3

let subtotal = price * quantity
let totalWithTax = subtotal * 110 / 100
let points = totalWithTax / 100
let goldPoints = totalWithTax * 2 / 100
let isFreeShipping = totalWithTax >= 5000
let message = "\(productName) を \(quantity) 個: 税込 \(totalWithTax) 円（\(points) ポイント付与）"
print(message)

check("小計が 1,194 になる", subtotal, 1194)
check("税込金額が 1,313 になる", totalWithTax, 1313)
check("付与ポイントが 13 になる", points, 13)
check("ゴールド会員の付与ポイントが 26 になる", goldPoints, 26)
check("送料無料ではない", isFreeShipping, false)
check("表示する文章が正しい", message, "国産りんごジュース 1L を 3 個: 税込 1313 円（13 ポイント付与）")
