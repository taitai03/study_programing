import Testing
@testable import SakuraMartKit

private struct FailingAPI: ProductAPI {
    func fetchProducts() async throws -> [Product] { throw APIError.network }
    func fetchProduct(id: Int) async throws -> Product { throw APIError.network }
}

@MainActor
@Suite("商品一覧の ViewModel")
struct ProductListViewModelTests {
    @Test("読み込むと、商品を表示する")
    func load() async {
        let viewModel = ProductListViewModel(api: MockProductAPI(delayMilliseconds: 0))
        #expect(viewModel.state == .idle)
        await viewModel.load()
        #expect(viewModel.products.count == SampleData.products.count)
    }

    @Test("読み込みに失敗したら、エラーのメッセージを持つ")
    func failure() async {
        let viewModel = ProductListViewModel(api: FailingAPI())
        await viewModel.load()
        #expect(viewModel.state == .failed(message: "通信できませんでした。電波の状態を確認してください"))
        #expect(viewModel.products.isEmpty)
    }
}
