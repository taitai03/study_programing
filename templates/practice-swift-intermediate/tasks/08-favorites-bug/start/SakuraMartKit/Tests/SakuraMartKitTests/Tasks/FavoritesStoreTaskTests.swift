// 課題のテスト（変更しないでください）。お気に入りがアプリの再起動のあとも残ることを確かめる
import Testing
@testable import SakuraMartKit

@MainActor
@Suite("お気に入りの保存")
struct FavoritesStoreTaskTests {
    /// 同じ保存先から FavoritesStore を作り直すと「アプリの再起動」になる
    private func restart(_ store: KeyValueStore) -> FavoritesStore {
        FavoritesStore(store: store)
    }

    @Test("入れたお気に入りは、再起動しても残る（最後に入れたものも）")
    func persistAdd() {
        let storage = InMemoryKeyValueStore()
        let favorites = FavoritesStore(store: storage)
        favorites.toggle(1)
        favorites.toggle(11)
        #expect(restart(storage).productIDs == [1, 11])
    }

    @Test("外したお気に入りは、再起動しても外れたまま")
    func persistRemove() {
        let storage = InMemoryKeyValueStore()
        let favorites = FavoritesStore(store: storage)
        favorites.toggle(1)
        favorites.toggle(11)
        favorites.toggle(1)
        #expect(restart(storage).productIDs == [11])
    }

    @Test("1つだけ入れて、すぐに再起動しても残る")
    func persistSingle() {
        let storage = InMemoryKeyValueStore()
        FavoritesStore(store: storage).toggle(42)
        #expect(restart(storage).isFavorite(42))
    }

    @Test("上限（100件）を超えては入れられず、上限まで入れたものは残る")
    func limit() {
        let storage = InMemoryKeyValueStore()
        let favorites = FavoritesStore(store: storage)
        for id in 1...101 { favorites.toggle(id) }
        #expect(favorites.productIDs.count == 100)
        #expect(!favorites.isFavorite(101))
        #expect(restart(storage).productIDs.count == 100)
    }
}
