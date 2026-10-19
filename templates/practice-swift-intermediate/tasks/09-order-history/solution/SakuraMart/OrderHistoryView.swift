import SakuraMartKit
import SwiftUI

/// 注文履歴（月ごと、新しい順）
struct OrderHistoryView: View {
    let api: OrderAPI
    @State private var viewModel: OrderHistoryViewModel

    init(api: OrderAPI) {
        self.api = api
        _viewModel = State(initialValue: OrderHistoryViewModel(api: api))
    }

    var body: some View {
        content
            .navigationTitle("注文履歴")
            .navigationDestination(for: PastOrder.self) { order in
                OrderDetailView(orderID: order.id, api: api)
            }
            .task {
                if case .idle = viewModel.state { await viewModel.load() }
            }
            .refreshable { await viewModel.load() }
    }

    @ViewBuilder
    private var content: some View {
        switch viewModel.state {
        case .idle, .loading:
            ProgressView("読み込み中…")
        case .failed(let message):
            ContentUnavailableView {
                Label("読み込めませんでした", systemImage: "exclamationmark.triangle")
            } description: {
                Text(message)
            } actions: {
                Button("もう一度読み込む") {
                    Task { await viewModel.load() }
                }
            }
        case .loaded where viewModel.isEmpty:
            ContentUnavailableView("注文はまだありません", systemImage: "shippingbox")
        case .loaded:
            List(viewModel.sections) { section in
                Section(section.title) {
                    ForEach(section.orders) { order in
                        NavigationLink(value: order) {
                            OrderRow(order: order)
                        }
                    }
                }
            }
        }
    }
}

struct OrderRow: View {
    let order: PastOrder

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(order.items.first?.name ?? "")
                    + Text(order.items.count > 1 ? " ほか\(order.items.count - 1)点" : "")
                Text(order.status.label)
                    .font(.caption)
                    .foregroundStyle(order.status == .cancelled ? .red : .secondary)
            }
            Spacer()
            Text(formatYen(order.total))
                .monospacedDigit()
                .strikethrough(order.status == .cancelled)
        }
    }
}
