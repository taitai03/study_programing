import SakuraMartKit
import SwiftUI

@main
struct SakuraMartApp: App {
    @State private var favorites = FavoritesStore(store: UserDefaultsStore())
    @State private var cart = CartViewModel(rank: .silver)

    var body: some Scene {
        WindowGroup {
            RootView(api: AppConfig.productAPI)
                .environment(favorites)
                .environment(cart)
        }
    }
}
