import SakuraMartKit
import SwiftUI

/// タブ（商品、お気に入り、注文履歴、カート）
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
                OrderHistoryView(api: AppConfig.orderAPI)
            }
            .tabItem { Label("注文履歴", systemImage: "list.bullet.rectangle") }

            NavigationStack {
                CartView()
            }
            .tabItem { Label("カート", systemImage: "cart") }
            .badge(cart.cart.totalQuantity)
        }
    }
}
