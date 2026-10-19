// 課題のテスト（変更しないでください）
import Foundation
import Testing
@testable import SakuraMartKit

private let valid = SignupForm(name: " 山田 花子 ", email: " Hanako@Example.com ", password: "sakura2026", passwordConfirmation: "sakura2026")

@Suite("会員登録の入力チェック")
struct SignupValidationTaskTests {
    @Test("正しい入力なら、整えた値を返す")
    func validInput() throws {
        #expect(try valid.validate() == ValidatedSignup(name: "山田 花子", email: "hanako@example.com", password: "sakura2026"))
    }

    @Test("名前: 空白だけは nameMissing、51文字は nameTooLong")
    func name() {
        var form = valid
        form.name = "   "
        #expect(throws: SignupError.nameMissing) { try form.validate() }
        form.name = String(repeating: "あ", count: 51)
        #expect(throws: SignupError.nameTooLong(max: 50)) { try form.validate() }
        form.name = String(repeating: "あ", count: 50)
        #expect(throws: Never.self) { try form.validate() }
    }

    @Test("メールアドレスの形式", arguments: ["", "hanako", "hanako@", "@example.com", "hanako@example", "hana ko@example.com"])
    func email(email: String) {
        var form = valid
        form.email = email
        #expect(throws: SignupError.emailInvalid) { try form.validate() }
    }

    @Test("パスワード: 8文字以上で、英字と数字を両方含む")
    func password() {
        var form = valid
        form.password = "abc1234"
        form.passwordConfirmation = "abc1234"
        #expect(throws: SignupError.passwordTooShort(min: 8)) { try form.validate() }
        form.password = "abcdefgh"
        form.passwordConfirmation = "abcdefgh"
        #expect(throws: SignupError.passwordNeedsLetterAndNumber) { try form.validate() }
        form.password = "12345678"
        form.passwordConfirmation = "12345678"
        #expect(throws: SignupError.passwordNeedsLetterAndNumber) { try form.validate() }
    }

    @Test("パスワード（確認）が違えば passwordMismatch")
    func confirmation() {
        var form = valid
        form.passwordConfirmation = "sakura2027"
        #expect(throws: SignupError.passwordMismatch) { try form.validate() }
    }

    @Test("validate は、上の項目から順に確かめて、最初のエラーを投げる")
    func order() {
        let form = SignupForm(name: "", email: "x", password: "1", passwordConfirmation: "2")
        #expect(throws: SignupError.nameMissing) { try form.validate() }
    }

    @Test("エラーごとに、どの入力欄のエラーかと、ユーザーに見せるメッセージを持つ")
    func messages() {
        let cases: [(SignupError, SignupField, String)] = [
            (.nameMissing, .name, "お名前を入力してください"),
            (.nameTooLong(max: 50), .name, "お名前は50文字以内で入力してください"),
            (.emailInvalid, .email, "メールアドレスの形式が正しくありません"),
            (.passwordTooShort(min: 8), .password, "パスワードは8文字以上にしてください"),
            (.passwordNeedsLetterAndNumber, .password, "パスワードには英字と数字を両方含めてください"),
            (.passwordMismatch, .passwordConfirmation, "パスワード（確認）が一致しません"),
        ]
        for (error, field, message) in cases {
            #expect(error.field == field)
            #expect(error.errorDescription == message)
            // LocalizedError に準拠していれば、Error として扱っても同じメッセージになる
            #expect((error as Error).localizedDescription == message)
        }
    }

    @Test("fieldErrors は、すべての入力欄を確かめて、入力欄ごとのメッセージを返す")
    func fieldErrors() {
        let form = SignupForm(name: "", email: "x", password: "abcdefgh", passwordConfirmation: "abcdefgh")
        #expect(form.fieldErrors() == [
            .name: "お名前を入力してください",
            .email: "メールアドレスの形式が正しくありません",
            .password: "パスワードには英字と数字を両方含めてください",
        ])
        #expect(valid.fieldErrors().isEmpty)
    }
}
