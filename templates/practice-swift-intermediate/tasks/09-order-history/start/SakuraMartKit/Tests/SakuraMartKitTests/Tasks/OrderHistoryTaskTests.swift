// 課題のテスト（変更しないでください）
import Foundation
import Testing
@testable import SakuraMartKit

private func jst(_ text: String) -> Date {
    ISO8601DateFormatter().date(from: text + "+09:00")!
}

private let item = PastOrderItem(productID: 11, name: "静岡煎茶 100g", quantity: 2, unitPrice: 1080)
private let orders = [
    PastOrder(id: 1, orderedAt: jst("2026-03-31T23:59:00"), status: .completed, total: 2926, items: [item]),
    PastOrder(id: 3, orderedAt: jst("2026-04-15T12:00:00"), status: .shipped, total: 1738, items: [item]),
    PastOrder(id: 2, orderedAt: jst("2026-04-01T00:00:00"), status: .cancelled, total: 2926,
              items: [item, PastOrderItem(productID: 1, name: "国産こしひかり 5kg", quantity: 1, unitPrice: 2980)]),
]

/// 結果を差し替えられる偽物のAPI
private actor FakeOrderAPI: OrderAPI {
    var result: Result<[PastOrder], APIError>
    private(set) var calls = 0

    init(_ result: Result<[PastOrder], APIError>) {
        self.result = result
    }

    func set(_ result: Result<[PastOrder], APIError>) {
        self.result = result
    }

    func fetchOrders() async throws -> [PastOrder] {
        calls += 1
        return try result.get()
    }

    func fetchOrder(id: Int) async throws -> PastOrder {
        calls += 1
        guard let order = try result.get().first(where: { $0.id == id }) else { throw APIError.notFound }
        return order
    }
}

@MainActor
@Suite("注文履歴の一覧")
struct OrderHistoryListTaskTests {
    @Test("読み込むまでは idle、読み込むと新しい順の注文になる")
    func load() async {
        let viewModel = OrderHistoryViewModel(api: FakeOrderAPI(.success(orders)))
        #expect(viewModel.state == .idle)
        await viewModel.load()
        #expect(viewModel.state.value?.map(\.id) == [3, 2, 1])
    }

    @Test("日本時間の月ごとのセクションに分ける（新しい月が先、セクションの中も新しい順）")
    func sections() async {
        let viewModel = OrderHistoryViewModel(api: FakeOrderAPI(.success(orders)))
        await viewModel.load()
        #expect(viewModel.sections.map(\.title) == ["2026年4月", "2026年3月"])
        #expect(viewModel.sections.map { $0.orders.map(\.id) } == [[3, 2], [1]])
        #expect(viewModel.sections.map(\.id) == viewModel.sections.map(\.title))
    }

    @Test("注文が0件なら isEmpty が true（「注文はまだありません」を表示する）")
    func empty() async {
        let viewModel = OrderHistoryViewModel(api: FakeOrderAPI(.success([])))
        #expect(!viewModel.isEmpty)
        await viewModel.load()
        #expect(viewModel.isEmpty)
        #expect(viewModel.sections.isEmpty)
    }

    @Test("失敗したら、エラーのメッセージ（APIError の errorDescription）を持つ")
    func failure() async {
        let viewModel = OrderHistoryViewModel(api: FakeOrderAPI(.failure(.network)))
        await viewModel.load()
        #expect(viewModel.state == .failed(message: APIError.network.errorDescription!))
        #expect(viewModel.sections.isEmpty)
        #expect(!viewModel.isEmpty)
    }

    @Test("失敗したあと、もう一度読み込むと表示できる")
    func retry() async {
        let api = FakeOrderAPI(.failure(.server(status: 503)))
        let viewModel = OrderHistoryViewModel(api: api)
        await viewModel.load()
        await api.set(.success(orders))
        await viewModel.load()
        #expect(viewModel.state.value?.count == 3)
    }

    @Test("読み込み中は loading")
    func loading() async {
        let viewModel = OrderHistoryViewModel(api: MockOrderAPI(orders: orders, delayMilliseconds: 200))
        let task = Task { await viewModel.load() }
        try? await Task.sleep(nanoseconds: 50_000_000)
        #expect(viewModel.state.isLoading)
        await task.value
        #expect(viewModel.state.value?.count == 3)
    }
}

@MainActor
@Suite("注文の詳細")
struct OrderDetailTaskTests {
    @Test("注文を読み込み、明細の小計（単価 × 数量 の合計）と、表示用の日時・ステータスを返す")
    func load() async {
        let viewModel = OrderDetailViewModel(orderID: 2, api: FakeOrderAPI(.success(orders)))
        await viewModel.load()
        #expect(viewModel.state.value?.id == 2)
        #expect(viewModel.itemsSubtotal == 1080 * 2 + 2980)
        #expect(viewModel.orderedAtText == "2026/04/01 00:00")
        #expect(viewModel.statusLabel == "キャンセル")
    }

    @Test("読み込む前は、小計などは nil")
    func beforeLoad() {
        let viewModel = OrderDetailViewModel(orderID: 2, api: FakeOrderAPI(.success(orders)))
        #expect(viewModel.itemsSubtotal == nil)
        #expect(viewModel.orderedAtText == nil)
        #expect(viewModel.statusLabel == nil)
    }

    @Test("ない注文は、見つからないメッセージ")
    func notFound() async {
        let viewModel = OrderDetailViewModel(orderID: 999, api: FakeOrderAPI(.success(orders)))
        await viewModel.load()
        #expect(viewModel.state == .failed(message: APIError.notFound.errorDescription!))
    }
}
