/// 商品と、その在庫数
public struct CatalogItem: Identifiable, Equatable, Sendable {
    public let product: Product
    /// 在庫数。在庫のAPIから取れなかったときは nil（不明）
    public let stock: Int?

    public init(product: Product, stock: Int?) {
        self.product = product
        self.stock = stock
    }

    public var id: Int { product.id }

    /// 在庫があるか。不明なときは「ある」として扱う（買えないと決めつけない）
    public var isInStock: Bool {
        guard let stock else { return true }
        return stock > 0
    }
}

/// 商品の一覧と在庫を、別々のAPIから並列で取得してまとめる。
/// actor なので、同時に呼ばれても cachedItems が壊れない
public actor CatalogLoader {
    private let productAPI: ProductAPI
    private let stockAPI: StockAPI

    /// 最後に読み込んだ結果
    public private(set) var cachedItems: [CatalogItem]?

    public init(productAPI: ProductAPI, stockAPI: StockAPI) {
        self.productAPI = productAPI
        self.stockAPI = stockAPI
    }

    /// 読み込んだ結果を返す。読み込み済みなら覚えている結果を返す（forceRefresh なら読み込み直す）
    public func load(forceRefresh: Bool = false) async throws -> [CatalogItem] {
        if !forceRefresh, let cachedItems { return cachedItems }

        // async let で2つの通信を同時に始める
        async let products = productAPI.fetchProducts()
        async let stocks = fetchStockIgnoringErrors()

        let stockByID = Dictionary((try await stocks ?? []).map { ($0.productID, $0.stock) }, uniquingKeysWith: { _, last in last })
        let items = try await products.map { CatalogItem(product: $0, stock: stockByID[$0.id]) }

        // 読み込んでいる間にキャンセルされていたら、結果を覚えずに終わる
        try Task.checkCancellation()
        cachedItems = items
        return items
    }

    /// 在庫が取れなくても商品は表示したいので、在庫のエラーは nil にする（キャンセルは伝える）
    private func fetchStockIgnoringErrors() async throws -> [StockInfo]? {
        do {
            return try await stockAPI.fetchAllStock()
        } catch is CancellationError {
            throw CancellationError()
        } catch {
            return nil
        }
    }
}
