/// 商品の在庫数
public struct StockInfo: Hashable, Codable, Sendable {
    public let productID: Int
    public let stock: Int

    public init(productID: Int, stock: Int) {
        self.productID = productID
        self.stock = stock
    }
}

/// 在庫のAPI（倉庫のシステム）。商品のAPIとは別のサーバーにある
public protocol StockAPI: Sendable {
    /// すべての商品の在庫数
    func fetchAllStock() async throws -> [StockInfo]
}

/// 開発用のモック。商品IDから決まった在庫数を返す
public struct MockStockAPI: StockAPI {
    public var delayMilliseconds: UInt64

    public init(delayMilliseconds: UInt64 = 300) {
        self.delayMilliseconds = delayMilliseconds
    }

    public func fetchAllStock() async throws -> [StockInfo] {
        try await Task.sleep(nanoseconds: delayMilliseconds * 1_000_000)
        return SampleData.products.map { StockInfo(productID: $0.id, stock: ($0.id * 37) % 60) }
    }
}
