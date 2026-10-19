import Foundation

/// 端末に小さなデータを保存する場所。アプリでは UserDefaults、テストではメモリ上の実装を使う
public protocol KeyValueStore: AnyObject {
    func data(forKey key: String) -> Data?
    func set(_ data: Data?, forKey key: String)
}

/// メモリ上に保存する（テストとプレビュー用）。同じインスタンスを使い回すと「アプリの再起動」を再現できる
public final class InMemoryKeyValueStore: KeyValueStore {
    private var values: [String: Data] = [:]

    public init() {}

    public func data(forKey key: String) -> Data? {
        values[key]
    }

    public func set(_ data: Data?, forKey key: String) {
        values[key] = data
    }
}
