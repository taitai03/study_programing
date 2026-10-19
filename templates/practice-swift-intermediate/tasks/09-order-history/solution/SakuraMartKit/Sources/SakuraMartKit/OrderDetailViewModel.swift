import Foundation
import Observation

/// 注文の詳細の画面のロジック
@MainActor
@Observable
public final class OrderDetailViewModel {
    public let orderID: Int
    public private(set) var state: LoadState<PastOrder> = .idle
    private let api: OrderAPI
    private let calendar: Calendar

    public init(orderID: Int, api: OrderAPI, calendar: Calendar = .japan) {
        self.orderID = orderID
        self.api = api
        self.calendar = calendar
    }

    /// 明細の小計（単価 × 数量 の合計、税抜）
    public var itemsSubtotal: Int? {
        state.value?.items.reduce(0) { $0 + $1.unitPrice * $1.quantity }
    }

    /// 注文日時（例: "2026/04/15 12:00"）
    public var orderedAtText: String? {
        guard let date = state.value?.orderedAt else { return nil }
        let c = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        return String(format: "%04d/%02d/%02d %02d:%02d", c.year!, c.month!, c.day!, c.hour!, c.minute!)
    }

    public var statusLabel: String? {
        state.value?.status.label
    }

    public func load() async {
        state = .loading
        do {
            state = .loaded(try await api.fetchOrder(id: orderID))
        } catch {
            state = .failed(message: (error as? LocalizedError)?.errorDescription ?? "注文を読み込めませんでした")
        }
    }
}
