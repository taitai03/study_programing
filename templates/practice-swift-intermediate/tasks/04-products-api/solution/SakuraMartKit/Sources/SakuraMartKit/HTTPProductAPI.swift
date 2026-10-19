import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

/// さくらマートの会員向けAPI（Next.js版）から商品を取得する
public struct HTTPProductAPI: ProductAPI {
    private let baseURL: URL
    private let client: HTTPClient

    public init(baseURL: URL, client: HTTPClient = URLSessionHTTPClient()) {
        self.baseURL = baseURL
        self.client = client
    }

    /// GET /api/products → { "products": [...] }
    public func fetchProducts() async throws -> [Product] {
        let response: ProductsResponse = try await get("api/products")
        return response.products
    }

    /// GET /api/products/{id} → { "product": {...} }
    public func fetchProduct(id: Int) async throws -> Product {
        let response: ProductResponse = try await get("api/products/\(id)")
        return response.product
    }

    private struct ProductsResponse: Decodable {
        let products: [Product]
    }

    private struct ProductResponse: Decodable {
        let product: Product
    }

    /// GET でリクエストして、JSON を T にする。失敗の理由を APIError に変える
    private func get<T: Decodable>(_ path: String) async throws -> T {
        let url = baseURL.appendingPathComponent(path)
        let data: Data
        let response: HTTPURLResponse
        do {
            (data, response) = try await client.get(url)
        } catch {
            throw APIError.network
        }

        switch response.statusCode {
        case 200..<300:
            break
        case 404:
            throw APIError.notFound
        default:
            throw APIError.server(status: response.statusCode)
        }

        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw APIError.decoding
        }
    }
}
