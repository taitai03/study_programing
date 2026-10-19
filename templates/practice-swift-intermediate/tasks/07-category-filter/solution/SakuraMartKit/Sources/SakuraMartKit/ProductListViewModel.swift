import Foundation
import Observation

/// 商品一覧の画面のロジック。SwiftUI に依存しないので、テストできる
@MainActor
@Observable
public final class ProductListViewModel {
    public private(set) var state: LoadState<[Product]> = .idle
    /// 選んでいるカテゴリ。nil なら「すべて」
    public private(set) var selectedCategory: String?
    private let api: ProductAPI

    public init(api: ProductAPI) {
        self.api = api
    }

    /// 読み込んだ商品
    public var products: [Product] {
        state.value ?? []
    }

    /// 読み込んだ商品のカテゴリ（最初に出てきた順、重複なし）
    public var categories: [String] {
        var seen = Set<String>()
        return products.map(\.category).filter { seen.insert($0).inserted }
    }

    /// 表示する商品（選んでいるカテゴリで絞り込んだもの）
    public var filteredProducts: [Product] {
        guard let selectedCategory else { return products }
        return products.filter { $0.category == selectedCategory }
    }

    /// カテゴリを選ぶ（nil なら「すべて」）。一覧にないカテゴリは選べない
    public func select(category: String?) {
        guard let category else {
            selectedCategory = nil
            return
        }
        if categories.contains(category) { selectedCategory = category }
    }

    public func load() async {
        state = .loading
        do {
            state = .loaded(try await api.fetchProducts())
            // 選んでいたカテゴリの商品がなくなっていたら「すべて」に戻す
            if let selectedCategory, !categories.contains(selectedCategory) {
                self.selectedCategory = nil
            }
        } catch {
            state = .failed(message: (error as? LocalizedError)?.errorDescription ?? "商品を読み込めませんでした")
        }
    }
}
