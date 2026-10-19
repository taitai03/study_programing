let rankLabels = ["general": "一般", "silver": "シルバー", "gold": "ゴールド"]

func memberLabel(name: String?, rank: String?) -> String {
    let rankLabel = rankLabels[rank ?? "general"] ?? "一般"
    return "\(name ?? "ゲスト") 様（\(rankLabel)）"
}

func pointsLabel(_ points: Int?) -> String {
    "\(points ?? 0) pt"
}

func parseQuantity(_ text: String) -> Int? {
    guard let quantity = Int(text), (1...10).contains(quantity) else {
        return nil
    }
    return quantity
}

// MARK: - セルフチェック（ここは変更しないでください）
check("名前とランクがそろった会員", memberLabel(name: "山田 花子", rank: "gold"), "山田 花子 様（ゴールド）")
check("名前がない会員", memberLabel(name: nil, rank: "silver"), "ゲスト 様（シルバー）")
check("ランクがない会員", memberLabel(name: "佐藤 一郎", rank: nil), "佐藤 一郎 様（一般）")
check("知らないランクの会員", memberLabel(name: "鈴木 次郎", rank: "platinum"), "鈴木 次郎 様（一般）")
check("ポイント残高", pointsLabel(1200), "1200 pt")
check("ポイント残高がない", pointsLabel(nil), "0 pt")
check("数量 \"3\" は 3", parseQuantity("3"), 3)
check("数量 \"abc\" は nil", parseQuantity("abc"), nil)
check("数量 \"0\" は nil", parseQuantity("0"), nil)
check("数量 \"11\" は nil", parseQuantity("11"), nil)
check("数量が空欄なら nil", parseQuantity(""), nil)
