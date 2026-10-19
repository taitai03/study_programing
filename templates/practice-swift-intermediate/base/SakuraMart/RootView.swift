import SakuraMartKit
import SwiftUI

/// タブ（商品、お気に入り、カート）
struct RootView: View {
    let api: ProductAPI
    @Environment(CartViewModel.self) private var cart

    var body: some View {
        TabView {
            NavigationStack {
                ProductListView(api: api)
            }
            .tabItem { Label("商品", systemImage: "bag") }

            NavigationStack {
                FavoritesView(api: api)
            }
            .tabItem { Label("お気に入り", systemImage: "heart") }

            NavigationStack {
                CartView()
            }
            .tabItem { Label("カート", systemImage: "cart") }
            .badge(cart.cart.totalQuantity)
        }
    }
}
