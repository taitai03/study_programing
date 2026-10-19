import Testing
@testable import SakuraMartKit

@MainActor
@Suite("注文履歴の ViewModel")
struct OrderHistoryViewModelTests {
    @Test("モックの注文を、月ごとのセクションにまとめられる")
    func sampleOrders() async {
        let viewModel = OrderHistoryViewModel(api: MockOrderAPI(delayMilliseconds: 0))
        await viewModel.load()
        let ids = viewModel.sections.flatMap { $0.orders.map(\.id) }
        #expect(ids.count == MockOrderAPI.sampleOrders.count)
        #expect(Set(ids).count == ids.count)
    }
}
