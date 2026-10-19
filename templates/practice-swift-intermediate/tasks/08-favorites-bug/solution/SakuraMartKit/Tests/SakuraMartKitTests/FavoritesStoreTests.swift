import Testing
@testable import SakuraMartKit

// 問い合わせ「お気に入りが再起動すると消える」（CS-2210）の再発防止
@MainActor
@Suite("お気に入り")
struct FavoritesStoreTests {
    @Test("お気に入りを変えるたびに、変えたあとの状態を保存する")
    func savesAfterChange() {
        let storage = InMemoryKeyValueStore()
        let favorites = FavoritesStore(store: storage)
        favorites.toggle(5)
        #expect(FavoritesStore(store: storage).productIDs == [5])
        favorites.toggle(5)
        #expect(FavoritesStore(store: storage).productIDs.isEmpty)
    }
}
