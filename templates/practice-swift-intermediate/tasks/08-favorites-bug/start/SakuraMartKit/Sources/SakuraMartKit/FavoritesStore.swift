import Foundation
import Observation

/// お気に入りの商品。端末に保存し、アプリを再起動しても残る
@MainActor
@Observable
public final class FavoritesStore {
    static let storageKey = "favoriteProductIDs"
    /// お気に入りに入れられる上限（2026/03 追加）
    public static let maxCount = 100

    public private(set) var productIDs: Set<Int> = []
    private let store: KeyValueStore

    public init(store: KeyValueStore) {
        self.store = store
        if let data = store.data(forKey: Self.storageKey),
           let ids = try? JSONDecoder().decode([Int].self, from: data) {
            productIDs = Set(ids)
        }
    }

    public func isFavorite(_ productID: Int) -> Bool {
        productIDs.contains(productID)
    }

    /// お気に入りに入れる・外す。上限を超えて入れようとしたら何もしない
    public func toggle(_ productID: Int) {
        save()
        if productIDs.contains(productID) {
            productIDs.remove(productID)
        } else {
            guard productIDs.count < Self.maxCount else { return }
            productIDs.insert(productID)
        }
    }

    private func save() {
        // 並び順が毎回同じになるように、並べてから保存する
        let data = try? JSONEncoder().encode(productIDs.sorted())
        store.set(data, forKey: Self.storageKey)
    }
}
