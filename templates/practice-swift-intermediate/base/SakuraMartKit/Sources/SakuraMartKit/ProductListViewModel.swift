import Foundation
import Observation

/// 商品一覧の画面のロジック。SwiftUI に依存しないので、テストできる
@MainActor
@Observable
public final class ProductListViewModel {
    public private(set) var state: LoadState<[Product]> = .idle
    private let api: ProductAPI

    public init(api: ProductAPI) {
        self.api = api
    }

    /// 表示する商品
    public var products: [Product] {
        state.value ?? []
    }

    public func load() async {
        state = .loading
        do {
            state = .loaded(try await api.fetchProducts())
        } catch {
            state = .failed(message: (error as? LocalizedError)?.errorDescription ?? "商品を読み込めませんでした")
        }
    }
}
