import Foundation
#if canImport(FoundationNetworking)
// Linux では URLSession が FoundationNetworking にある
import FoundationNetworking
#endif

/// HTTP の通信。テストでは、本物の通信の代わりに決まったレスポンスを返すものに差し替える
public protocol HTTPClient: Sendable {
    /// GET でリクエストして、本文とレスポンスを返す。通信できなければ例外（URLError など）を投げる
    func get(_ url: URL) async throws -> (Data, HTTPURLResponse)
}

/// URLSession を使う、本物の HTTPClient
public struct URLSessionHTTPClient: HTTPClient {
    private let session: URLSession

    public init(session: URLSession = .shared) {
        self.session = session
    }

    public func get(_ url: URL) async throws -> (Data, HTTPURLResponse) {
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        return (data, http)
    }
}
