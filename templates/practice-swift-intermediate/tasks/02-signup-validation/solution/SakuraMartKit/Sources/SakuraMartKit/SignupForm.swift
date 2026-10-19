import Foundation

/// 会員登録の入力（画面の入力欄の値そのまま）
public struct SignupForm: Equatable, Sendable {
    public var name: String
    public var email: String
    public var password: String
    public var passwordConfirmation: String

    public init(name: String = "", email: String = "", password: String = "", passwordConfirmation: String = "") {
        self.name = name
        self.email = email
        self.password = password
        self.passwordConfirmation = passwordConfirmation
    }
}

/// 入力欄
public enum SignupField: String, CaseIterable, Sendable {
    case name
    case email
    case password
    case passwordConfirmation
}

/// チェックを通った入力（前後の空白を取り除き、メールアドレスは小文字にしたもの）
public struct ValidatedSignup: Equatable, Sendable {
    public let name: String
    public let email: String
    public let password: String

    public init(name: String, email: String, password: String) {
        self.name = name
        self.email = email
        self.password = password
    }
}

/// 入力の誤り
public enum SignupError: Error, Equatable, LocalizedError {
    case nameMissing
    case nameTooLong(max: Int)
    case emailInvalid
    case passwordTooShort(min: Int)
    case passwordNeedsLetterAndNumber
    case passwordMismatch

    /// どの入力欄の誤りか
    public var field: SignupField {
        switch self {
        case .nameMissing, .nameTooLong: .name
        case .emailInvalid: .email
        case .passwordTooShort, .passwordNeedsLetterAndNumber: .password
        case .passwordMismatch: .passwordConfirmation
        }
    }

    /// ユーザーに見せるメッセージ
    public var errorDescription: String? {
        switch self {
        case .nameMissing: "お名前を入力してください"
        case .nameTooLong(let max): "お名前は\(max)文字以内で入力してください"
        case .emailInvalid: "メールアドレスの形式が正しくありません"
        case .passwordTooShort(let min): "パスワードは\(min)文字以上にしてください"
        case .passwordNeedsLetterAndNumber: "パスワードには英字と数字を両方含めてください"
        case .passwordMismatch: "パスワード（確認）が一致しません"
        }
    }
}

extension SignupForm {
    static let maxNameLength = 50
    static let minPasswordLength = 8

    /// 上の入力欄から順に確かめ、最初の誤りを投げる。誤りがなければ整えた値を返す
    public func validate() throws -> ValidatedSignup {
        let name = try validName()
        let email = try validEmail()
        try validatePassword()
        try validateConfirmation()
        return ValidatedSignup(name: name, email: email, password: password)
    }

    /// すべての入力欄を確かめ、入力欄ごとのメッセージを返す（画面で、入力欄の下に表示する）
    public func fieldErrors() -> [SignupField: String] {
        let checks: [() throws -> Void] = [
            { _ = try validName() },
            { _ = try validEmail() },
            { try validatePassword() },
            { try validateConfirmation() },
        ]
        var errors: [SignupField: String] = [:]
        for check in checks {
            do {
                try check()
            } catch let error as SignupError {
                errors[error.field] = error.errorDescription
            } catch {
                assertionFailure("想定していないエラー: \(error)")
            }
        }
        return errors
    }

    private func validName() throws -> String {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw SignupError.nameMissing }
        guard trimmed.count <= Self.maxNameLength else { throw SignupError.nameTooLong(max: Self.maxNameLength) }
        return trimmed
    }

    private func validEmail() throws -> String {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard trimmed.range(of: #"^[^@\s]+@[^@\s]+\.[^@\s]+$"#, options: .regularExpression) != nil else {
            throw SignupError.emailInvalid
        }
        return trimmed
    }

    private func validatePassword() throws {
        guard password.count >= Self.minPasswordLength else {
            throw SignupError.passwordTooShort(min: Self.minPasswordLength)
        }
        let hasLetter = password.contains { $0.isASCII && $0.isLetter }
        let hasNumber = password.contains { $0.isASCII && $0.isNumber }
        guard hasLetter && hasNumber else { throw SignupError.passwordNeedsLetterAndNumber }
    }

    private func validateConfirmation() throws {
        guard password == passwordConfirmation else { throw SignupError.passwordMismatch }
    }
}
