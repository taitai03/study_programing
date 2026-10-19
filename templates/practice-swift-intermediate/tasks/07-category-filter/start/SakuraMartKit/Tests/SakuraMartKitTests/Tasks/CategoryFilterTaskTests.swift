// 課題のテスト（変更しないでください）
import Testing
@testable import SakuraMartKit

private let products = [
    Product(id: 1, name: "国産こしひかり 5kg", description: "", price: 2980, category: "食品"),
    Product(id: 10, name: "天然水 2L × 6本", description: "", price: 980, category: "飲料"),
    Product(id: 11, name: "静岡煎茶 100g", description: "", price: 1080, category: "飲料"),
    Product(id: 18, name: "ボックスティッシュ 5箱", description: "", price: 398, category: "日用品"),
]

@MainActor
@Suite("商品一覧のカテゴリ絞り込み")
struct CategoryFilterTaskTests {
    private func loadedViewModel(_ items: [Product] = products) async -> ProductListViewModel {
        let viewModel = ProductListViewModel(api: MockProductAPI(products: items, delayMilliseconds: 0))
        await viewModel.load()
        return viewModel
    }

    @Test("読み込んだ商品のカテゴリを、最初に出てきた順に重複なく返す")
    func categories() async {
        let viewModel = await loadedViewModel()
        #expect(viewModel.categories == ["食品", "飲料", "日用品"])
    }

    @Test("読み込む前は、カテゴリは空")
    func categoriesBeforeLoad() {
        #expect(ProductListViewModel(api: MockProductAPI(products: products)).categories.isEmpty)
    }

    @Test("最初は「すべて」（selectedCategory が nil）で、すべての商品を表示する")
    func allByDefault() async {
        let viewModel = await loadedViewModel()
        #expect(viewModel.selectedCategory == nil)
        #expect(viewModel.filteredProducts == products)
    }

    @Test("カテゴリを選ぶと、そのカテゴリの商品だけを表示する。nil に戻すとすべて")
    func select() async {
        let viewModel = await loadedViewModel()
        viewModel.select(category: "飲料")
        #expect(viewModel.selectedCategory == "飲料")
        #expect(viewModel.filteredProducts.map(\.id) == [10, 11])
        viewModel.select(category: nil)
        #expect(viewModel.filteredProducts.count == 4)
    }

    @Test("一覧にないカテゴリは選べない（nil のまま）")
    func selectUnknown() async {
        let viewModel = await loadedViewModel()
        viewModel.select(category: "家電")
        #expect(viewModel.selectedCategory == nil)
    }

    @Test("読み込み直して、選んでいたカテゴリの商品がなくなったら「すべて」に戻す")
    func resetAfterReload() async {
        let api = MutableProductAPI(products: products)
        let viewModel = ProductListViewModel(api: api)
        await viewModel.load()
        viewModel.select(category: "日用品")
        await api.set(products: Array(products.prefix(3)))
        await viewModel.load()
        #expect(viewModel.selectedCategory == nil)
        #expect(viewModel.filteredProducts.count == 3)
    }

    @Test("読み込み直しても、選んでいたカテゴリがまだあれば、そのまま")
    func keepAfterReload() async {
        let viewModel = await loadedViewModel()
        viewModel.select(category: "飲料")
        await viewModel.load()
        #expect(viewModel.selectedCategory == "飲料")
    }
}

/// 返す商品を途中で変えられるAPI
private actor MutableProductAPI: ProductAPI {
    private var products: [Product]

    init(products: [Product]) {
        self.products = products
    }

    func set(products: [Product]) {
        self.products = products
    }

    func fetchProducts() async throws -> [Product] { products }
    func fetchProduct(id: Int) async throws -> Product { products[0] }
}
