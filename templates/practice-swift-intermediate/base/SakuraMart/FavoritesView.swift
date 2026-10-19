import SakuraMartKit
import SwiftUI

/// お気に入りの商品
struct FavoritesView: View {
    @Environment(FavoritesStore.self) private var favorites
    @State private var viewModel: ProductListViewModel

    init(api: ProductAPI) {
        _viewModel = State(initialValue: ProductListViewModel(api: api))
    }

    private var products: [Product] {
        viewModel.products.filter { favorites.isFavorite($0.id) }
    }

    var body: some View {
        Group {
            if viewModel.state.isLoading {
                ProgressView("読み込み中…")
            } else if products.isEmpty {
                ContentUnavailableView("お気に入りはまだありません", systemImage: "heart",
                                       description: Text("商品の詳細で ♡ を押すと、ここに表示されます"))
            } else {
                List(products) { product in
                    NavigationLink(value: product) {
                        ProductRow(product: product)
                    }
                }
            }
        }
        .navigationTitle("お気に入り")
        .navigationDestination(for: Product.self) { product in
            ProductDetailView(product: product)
        }
        .task { await viewModel.load() }
    }
}
