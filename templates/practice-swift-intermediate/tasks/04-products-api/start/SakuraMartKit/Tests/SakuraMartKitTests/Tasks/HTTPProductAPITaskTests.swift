// 課題のテスト（変更しないでください）
import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif
import Testing
@testable import SakuraMartKit

/// 決まったレスポンスを返す HTTPClient。リクエストされた URL を記録する
private final class StubHTTPClient: HTTPClient, @unchecked Sendable {
    enum Reply {
        case response(status: Int, body: String)
        case failure(Error)
    }

    let reply: Reply
    private(set) var requestedURLs: [URL] = []

    init(_ reply: Reply) {
        self.reply = reply
    }

    func get(_ url: URL) async throws -> (Data, HTTPURLResponse) {
        requestedURLs.append(url)
        switch reply {
        case .response(let status, let body):
            let response = HTTPURLResponse(url: url, statusCode: status, httpVersion: nil, headerFields: nil)!
            return (Data(body.utf8), response)
        case .failure(let error):
            throw error
        }
    }
}

private let baseURL = URL(string: "https://sakura-mart.example")!

private let productsJSON = """
{
  "products": [
    { "id": 1, "name": "国産こしひかり 5kg", "description": "食品の定番商品です。", "price": 2980, "category": "食品" },
    { "id": 11, "name": "静岡煎茶 100g", "description": "飲料の定番商品です。", "price": 1080, "category": "飲料" }
  ]
}
"""

@Suite("商品API（HTTP）")
struct HTTPProductAPITaskTests {
    @Test("商品一覧: GET /api/products の JSON を Product の配列にする")
    func fetchProducts() async throws {
        let client = StubHTTPClient(.response(status: 200, body: productsJSON))
        let api = HTTPProductAPI(baseURL: baseURL, client: client)
        let products = try await api.fetchProducts()
        #expect(client.requestedURLs.map(\.absoluteString) == ["https://sakura-mart.example/api/products"])
        #expect(products == [
            Product(id: 1, name: "国産こしひかり 5kg", description: "食品の定番商品です。", price: 2980, category: "食品"),
            Product(id: 11, name: "静岡煎茶 100g", description: "飲料の定番商品です。", price: 1080, category: "飲料"),
        ])
    }

    @Test("商品の詳細: GET /api/products/{id} の JSON を Product にする")
    func fetchProduct() async throws {
        let body = #"{ "product": { "id": 11, "name": "静岡煎茶 100g", "description": "", "price": 1080, "category": "飲料" } }"#
        let client = StubHTTPClient(.response(status: 200, body: body))
        let product = try await HTTPProductAPI(baseURL: baseURL, client: client).fetchProduct(id: 11)
        #expect(client.requestedURLs.map(\.absoluteString) == ["https://sakura-mart.example/api/products/11"])
        #expect(product.name == "静岡煎茶 100g")
    }

    @Test("ProductAPI に準拠しているので、モックと差し替えて使える")
    func conformsToProductAPI() async throws {
        let api: any ProductAPI = HTTPProductAPI(baseURL: baseURL, client: StubHTTPClient(.response(status: 200, body: productsJSON)))
        let viewModel = await ProductListViewModel(api: api)
        await viewModel.load()
        #expect(await viewModel.products.count == 2)
    }

    @Test("404 は APIError.notFound")
    func notFound() async {
        let api = HTTPProductAPI(baseURL: baseURL, client: StubHTTPClient(.response(status: 404, body: #"{"error":"商品が見つかりません"}"#)))
        await #expect(throws: APIError.notFound) { try await api.fetchProduct(id: 999) }
    }

    @Test("そのほかの 200番台以外は APIError.server（ステータスコード付き）", arguments: [500, 503, 401])
    func serverError(status: Int) async {
        let api = HTTPProductAPI(baseURL: baseURL, client: StubHTTPClient(.response(status: status, body: "")))
        await #expect(throws: APIError.server(status: status)) { try await api.fetchProducts() }
    }

    @Test("通信できなければ APIError.network")
    func network() async {
        let api = HTTPProductAPI(baseURL: baseURL, client: StubHTTPClient(.failure(URLError(.notConnectedToInternet))))
        await #expect(throws: APIError.network) { try await api.fetchProducts() }
    }

    @Test("JSON の形が違えば APIError.decoding", arguments: [
        #"{ "items": [] }"#,
        #"{ "products": [ { "id": "1", "name": "x", "description": "", "price": 100, "category": "食品" } ] }"#,
        "not json",
    ])
    func decoding(body: String) async {
        let api = HTTPProductAPI(baseURL: baseURL, client: StubHTTPClient(.response(status: 200, body: body)))
        await #expect(throws: APIError.decoding) { try await api.fetchProducts() }
    }
}
