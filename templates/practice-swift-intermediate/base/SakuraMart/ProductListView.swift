import SakuraMartKit
import SwiftUI

/// 商品一覧
struct ProductListView: View {
    @State private var viewModel: ProductListViewModel

    init(api: ProductAPI) {
        _viewModel = State(initialValue: ProductListViewModel(api: api))
    }

    var body: some View {
        content
            .navigationTitle("商品")
            .navigationDestination(for: Product.self) { product in
                ProductDetailView(product: product)
            }
            .task {
                if case .idle = viewModel.state { await viewModel.load() }
            }
            .refreshable { await viewModel.load() }
    }

    @ViewBuilder
    private var content: some View {
        switch viewModel.state {
        case .idle, .loading:
            ProgressView("読み込み中…")
        case .failed(let message):
            ContentUnavailableView {
                Label("読み込めませんでした", systemImage: "exclamationmark.triangle")
            } description: {
                Text(message)
            } actions: {
                Button("もう一度読み込む") {
                    Task { await viewModel.load() }
                }
            }
        case .loaded:
            List(viewModel.products) { product in
                NavigationLink(value: product) {
                    ProductRow(product: product)
                }
            }
        }
    }
}

/// 一覧の1行
struct ProductRow: View {
    let product: Product
    @Environment(FavoritesStore.self) private var favorites

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(product.name)
                Text(product.category)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            if favorites.isFavorite(product.id) {
                Image(systemName: "heart.fill")
                    .foregroundStyle(.pink)
                    .accessibilityLabel("お気に入り")
            }
            Text(formatYen(product.price))
                .monospacedDigit()
        }
    }
}
