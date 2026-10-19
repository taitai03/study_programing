import SakuraMartKit
import SwiftUI

/// 商品の詳細。カートに入れる、お気に入りに入れる
struct ProductDetailView: View {
    let product: Product
    @Environment(FavoritesStore.self) private var favorites
    @Environment(CartViewModel.self) private var cart
    @State private var quantity = 1
    @State private var added = false

    var body: some View {
        Form {
            Section {
                LabeledContent("カテゴリ", value: product.category)
                LabeledContent("価格（税抜）", value: formatYen(product.price))
                Text(product.description)
                    .foregroundStyle(.secondary)
            }
            Section {
                Stepper("数量: \(quantity)", value: $quantity, in: 1...Cart.maxQuantity)
                Button("カートに入れる") {
                    cart.add(product, quantity: quantity)
                    added = true
                }
            }
        }
        .navigationTitle(product.name)
        .toolbar {
            Button {
                favorites.toggle(product.id)
            } label: {
                Image(systemName: favorites.isFavorite(product.id) ? "heart.fill" : "heart")
            }
            .accessibilityLabel(favorites.isFavorite(product.id) ? "お気に入りから外す" : "お気に入りに入れる")
        }
        .alert("カートに入れました", isPresented: $added) {
            Button("OK", role: .cancel) {}
        }
    }
}
