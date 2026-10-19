// 課題のテスト（変更しないでください）
import Foundation
import Testing
@testable import SakuraMartKit

private let tea = Product(id: 11, name: "静岡煎茶 100g", description: "", price: 1080, category: "飲料")
private let rice = Product(id: 1, name: "国産こしひかり 5kg", description: "", price: 2980, category: "食品")

/// 呼ばれた回数を数える、遅さを変えられる偽物のAPI
private final class FakeProductAPI: ProductAPI, @unchecked Sendable {
    let delay: UInt64
    let error: Error?
    private let lock = NSLock()
    private var _calls = 0
    var calls: Int { lock.withLock { _calls } }

    init(delayMilliseconds: UInt64 = 0, error: Error? = nil) {
        delay = delayMilliseconds
        self.error = error
    }

    func fetchProducts() async throws -> [Product] {
        lock.withLock { _calls += 1 }
        try await Task.sleep(nanoseconds: delay * 1_000_000)
        if let error { throw error }
        return [rice, tea]
    }

    func fetchProduct(id: Int) async throws -> Product { rice }
}

private struct FakeStockAPI: StockAPI {
    var delayMilliseconds: UInt64 = 0
    var error: Error?
    var stocks = [StockInfo(productID: 1, stock: 0), StockInfo(productID: 11, stock: 12)]

    func fetchAllStock() async throws -> [StockInfo] {
        try await Task.sleep(nanoseconds: delayMilliseconds * 1_000_000)
        if let error { throw error }
        return stocks
    }
}

@Suite("カタログの読み込み（並行処理）")
struct CatalogLoaderTaskTests {
    @Test("商品と在庫をまとめて、商品の順に CatalogItem にする")
    func combine() async throws {
        let loader = CatalogLoader(productAPI: FakeProductAPI(), stockAPI: FakeStockAPI())
        let items = try await loader.load()
        #expect(items == [CatalogItem(product: rice, stock: 0), CatalogItem(product: tea, stock: 12)])
        #expect(items.map(\.isInStock) == [false, true])
        #expect(items.map(\.id) == [1, 11])
    }

    @Test("商品と在庫は、順番に待たずに並列で取得する")
    func parallel() async throws {
        let loader = CatalogLoader(productAPI: FakeProductAPI(delayMilliseconds: 200), stockAPI: FakeStockAPI(delayMilliseconds: 200))
        let clock = ContinuousClock()
        let elapsed = try await clock.measure { _ = try await loader.load() }
        #expect(elapsed < .milliseconds(350))
    }

    @Test("在庫が取れなくても、商品は表示する（在庫は nil = 不明）。在庫が不明な商品は在庫ありとして扱う")
    func stockFailure() async throws {
        let loader = CatalogLoader(productAPI: FakeProductAPI(), stockAPI: FakeStockAPI(error: APIError.network))
        let items = try await loader.load()
        #expect(items.map(\.stock) == [nil, nil])
        #expect(items.allSatisfy { $0.isInStock })
    }

    @Test("在庫の一覧にない商品の在庫は nil")
    func missingStock() async throws {
        let loader = CatalogLoader(productAPI: FakeProductAPI(), stockAPI: FakeStockAPI(stocks: [StockInfo(productID: 11, stock: 3)]))
        #expect(try await loader.load().map(\.stock) == [nil, 3])
    }

    @Test("商品が取れなければ、そのエラーを投げる")
    func productFailure() async {
        let loader = CatalogLoader(productAPI: FakeProductAPI(error: APIError.server(status: 503)), stockAPI: FakeStockAPI())
        await #expect(throws: APIError.server(status: 503)) { try await loader.load() }
    }

    @Test("一度読み込んだら、次からは覚えている結果を返す。forceRefresh なら読み込み直す")
    func cache() async throws {
        let products = FakeProductAPI()
        let loader = CatalogLoader(productAPI: products, stockAPI: FakeStockAPI())
        _ = try await loader.load()
        _ = try await loader.load()
        #expect(products.calls == 1)
        _ = try await loader.load(forceRefresh: true)
        #expect(products.calls == 2)
    }

    @Test("同時にたくさん呼ばれても、正しく動く（actor）")
    func concurrentCalls() async throws {
        let loader = CatalogLoader(productAPI: FakeProductAPI(delayMilliseconds: 10), stockAPI: FakeStockAPI(delayMilliseconds: 10))
        let counts = try await withThrowingTaskGroup(of: Int.self) { group in
            for _ in 0..<20 {
                group.addTask { try await loader.load(forceRefresh: true).count }
            }
            return try await group.reduce(into: [Int]()) { $0.append($1) }
        }
        #expect(counts == Array(repeating: 2, count: 20))
    }

    @Test("読み込み中にキャンセルされたら CancellationError を投げ、結果を覚えない")
    func cancellation() async throws {
        let products = FakeProductAPI(delayMilliseconds: 500)
        let loader = CatalogLoader(productAPI: products, stockAPI: FakeStockAPI(delayMilliseconds: 500))
        let task = Task { try await loader.load() }
        try await Task.sleep(nanoseconds: 50_000_000)
        task.cancel()
        await #expect(throws: CancellationError.self) { try await task.value }

        // 途中の結果を覚えていない
        #expect(await loader.cachedItems == nil)
    }
}
