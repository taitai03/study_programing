---
title: エラー処理
summary: throws、do-catch、独自のエラー型、ユーザーに見せるエラーメッセージを学びます。会員登録の入力チェックで、項目ごとのエラーを返します。
minutes: 50
---

## エラーを投げる・受け止める

処理を続けられない問題が起きたら、関数から **エラーを投げます**（`throw`）。エラーを投げる可能性のある関数には `throws` を付けます。

```swift
func validName(_ name: String) throws -> String {
    let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { throw SignupError.nameMissing }
    return trimmed
}
```

`throws` の関数を呼ぶときは `try` を付けます。エラーを受け止めるには `do-catch` を使います。

```swift
do {
    let name = try validName(form.name)
    print("ようこそ、\(name)さん")
} catch SignupError.nameMissing {
    print("名前を入力してください")
} catch {
    print("そのほかのエラー: \(error)")   // error という名前で受け取れる
}
```

| 書き方 | 意味 |
| --- | --- |
| `try` | エラーが投げられたら、呼び出し元に伝える（自分も `throws` の関数の中で使う） |
| `try?` | エラーなら `nil` にする（理由は捨てる） |
| `try!` | エラーにならないと分かっているときだけ。エラーならアプリが落ちる |

`try?` は手軽ですが、**なぜ失敗したのかが分からなくなります**。ユーザーに理由を伝える必要がある場面では使いません。

## 独自のエラー型

Swift のエラーは、`Error` プロトコルに準拠した型です。種類が決まっているエラーは `enum` で表すと、**どんなエラーがありえるか** が型から分かります。

```swift
enum SignupError: Error, Equatable {
    case nameMissing
    case nameTooLong(max: Int)   // 付属する値も持てる
    case emailInvalid
}
```

エラーに関係する情報（どの入力欄か、など）は、プロパティとして持たせます。

```swift
extension SignupError {
    var field: SignupField {
        switch self {
        case .nameMissing, .nameTooLong: .name
        case .emailInvalid: .email
        }
    }
}
```

## ユーザーに見せるメッセージ

エラーを `LocalizedError` にも準拠させ、`errorDescription` を書くと、**ユーザーに見せるメッセージ** を持たせられます。`error.localizedDescription` でも同じメッセージになるので、画面ではエラーの種類を知らなくても表示できます。

```swift
extension SignupError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .nameMissing: "お名前を入力してください"
        case .nameTooLong(let max): "お名前は\(max)文字以内で入力してください"
        case .emailInvalid: "メールアドレスの形式が正しくありません"
        }
    }
}
```

メッセージは **何がだめで、どうすればいいか** が分かるように書きます。「エラーが発生しました」だけでは、ユーザーは次に何をすればいいか分かりません。

## 1つ目で止めるか、全部集めるか

- **登録ボタンを押したとき**: 最初のエラーで止めて、登録しない（`validate() throws`）
- **入力欄の下にエラーを出すとき**: すべての入力欄を確かめて、項目ごとのメッセージを集める（`fieldErrors()`）

全部集めるときは、入力欄ごとのチェックを `do-catch` で1つずつ実行し、受け止めたエラーを辞書に入れていきます。同じチェックの関数を両方で使い回せば、ルールが食い違うことはありません。

## テストでエラーを確かめる

Swift Testing では、`#expect(throws:)` で、投げられるエラーを確かめられます。

```swift
#expect(throws: SignupError.nameMissing) {
    try form.validate()
}
```

エラー型が `Equatable` に準拠していると、付属する値（`max: 50`）まで比べられます。
