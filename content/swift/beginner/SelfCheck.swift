// セルフチェック用の関数です。Playground の Sources フォルダに入っています。
// Contents.swift の下のほうにある check(...) が、この関数を呼び出しています。

/// 実際の値（actual）が期待した値（expected）と同じなら ✅、違えば ❌ を表示する
public func check<T: Equatable>(_ title: String, _ actual: T, _ expected: T) {
    if actual == expected {
        print("✅ \(title)")
    } else {
        print("❌ \(title)")
        print("   期待した値: \(String(describing: expected))")
        print("   実際の値: \(String(describing: actual))")
    }
}
