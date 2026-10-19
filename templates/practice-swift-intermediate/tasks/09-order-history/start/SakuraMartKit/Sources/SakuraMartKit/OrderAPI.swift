import Foundation

/// 会員の注文履歴のAPI（Next.js版の GET /api/me/orders にあたる）
public protocol OrderAPI: Sendable {
    /// 自分の注文の一覧
    func fetchOrders() async throws -> [PastOrder]
    /// 注文の詳細。なければ APIError.notFound
    func fetchOrder(id: Int) async throws -> PastOrder
}

/// 開発用のモック
public struct MockOrderAPI: OrderAPI {
    public var orders: [PastOrder]
    public var delayMilliseconds: UInt64

    public init(orders: [PastOrder] = MockOrderAPI.sampleOrders, delayMilliseconds: UInt64 = 300) {
        self.orders = orders
        self.delayMilliseconds = delayMilliseconds
    }

    public func fetchOrders() async throws -> [PastOrder] {
        try await Task.sleep(nanoseconds: delayMilliseconds * 1_000_000)
        return orders
    }

    public func fetchOrder(id: Int) async throws -> PastOrder {
        try await Task.sleep(nanoseconds: delayMilliseconds * 1_000_000)
        guard let order = orders.first(where: { $0.id == id }) else { throw APIError.notFound }
        return order
    }

    /// サンプルの注文（並び順はばらばら）
    public static let sampleOrders: [PastOrder] = {
        let start = Date(timeIntervalSince1970: 1_772_323_200) // 2026-03-01 09:00（日本時間）
        let products = SampleData.products
        return (0..<12).map { i in
            let product = products[(i * 7) % products.count]
            let quantity = i % 3 + 1
            let statuses: [OrderStatus] = [.completed, .completed, .shipped, .cancelled, .paid, .completed]
            return PastOrder(
                id: 1000 + i,
                orderedAt: start.addingTimeInterval(Double((i * 5) % 12) * 4 * 86_400),
                status: statuses[i % statuses.count],
                total: product.price * quantity * 110 / 100 + 550,
                items: [PastOrderItem(productID: product.id, name: product.name, quantity: quantity, unitPrice: product.price)]
            )
        }
    }()
}
