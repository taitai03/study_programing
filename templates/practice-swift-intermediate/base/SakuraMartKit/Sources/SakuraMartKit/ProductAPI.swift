import Foundation

/// 商品のAPI。画面やテストからは、このプロトコルを通して使う（本物とモックを差し替えられる）
public protocol ProductAPI: Sendable {
    func fetchProducts() async throws -> [Product]
    func fetchProduct(id: Int) async throws -> Product
}

/// APIの呼び出しに失敗したとき
public enum APIError: Error, Equatable, LocalizedError {
    /// 見つからない（404）
    case notFound
    /// サーバーのエラー（ステータスコード）
    case server(status: Int)
    /// 通信できない
    case network
    /// レスポンスの形が想定と違う
    case decoding

    public var errorDescription: String? {
        switch self {
        case .notFound: "見つかりませんでした"
        case .server: "サーバーでエラーが起きました。時間をおいてお試しください"
        case .network: "通信できませんでした。電波の状態を確認してください"
        case .decoding: "データを読み込めませんでした"
        }
    }
}

/// 開発用のモックAPI。アプリの中のサンプルデータを返す
public struct MockProductAPI: ProductAPI {
    public var products: [Product]
    /// 通信にかかる時間（ミリ秒）。画面で「読み込み中」を確かめるため
    public var delayMilliseconds: UInt64

    public init(products: [Product] = SampleData.products, delayMilliseconds: UInt64 = 300) {
        self.products = products
        self.delayMilliseconds = delayMilliseconds
    }

    public func fetchProducts() async throws -> [Product] {
        try await Task.sleep(nanoseconds: delayMilliseconds * 1_000_000)
        return products
    }

    public func fetchProduct(id: Int) async throws -> Product {
        try await Task.sleep(nanoseconds: delayMilliseconds * 1_000_000)
        guard let product = products.first(where: { $0.id == id }) else { throw APIError.notFound }
        return product
    }
}
