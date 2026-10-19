import SakuraMartKit
import SwiftUI

/// 注文の詳細
struct OrderDetailView: View {
    @State private var viewModel: OrderDetailViewModel

    init(orderID: Int, api: OrderAPI) {
        _viewModel = State(initialValue: OrderDetailViewModel(orderID: orderID, api: api))
    }

    var body: some View {
        content
            .navigationTitle("注文 #\(viewModel.orderID)")
            .task { await viewModel.load() }
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
        case .loaded(let order):
            Form {
                Section {
                    LabeledContent("注文日時", value: viewModel.orderedAtText ?? "")
                    LabeledContent("ステータス", value: viewModel.statusLabel ?? "")
                }
                Section("明細") {
                    ForEach(order.items, id: \.productID) { item in
                        LabeledContent(item.name, value: "\(item.quantity)個 × \(formatYen(item.unitPrice))")
                    }
                    LabeledContent("小計（税抜）", value: formatYen(viewModel.itemsSubtotal ?? 0))
                }
                Section {
                    LabeledContent("お支払い金額（税込・送料込み）", value: formatYen(order.total))
                        .bold()
                }
            }
        }
    }
}
