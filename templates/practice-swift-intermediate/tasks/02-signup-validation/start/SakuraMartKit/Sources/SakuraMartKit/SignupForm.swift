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

// TODO: 入力チェック（TASK.md）
