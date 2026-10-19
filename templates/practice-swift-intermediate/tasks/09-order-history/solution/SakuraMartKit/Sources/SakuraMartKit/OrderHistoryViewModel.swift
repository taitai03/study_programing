import Foundation
import Observation

/// 注文履歴の、月ごとのまとまり
public struct OrderMonthSection: Identifiable, Equatable, Sendable {
    /// 例: "2026年4月"
    public let title: String
    /// 新しい順
    public let orders: [PastOrder]

    public var id: String { title }
}

/// 注文履歴の一覧の画面のロジック
@MainActor
@Observable
public final class OrderHistoryViewModel {
    public private(set) var state: LoadState<[PastOrder]> = .idle
    private let api: OrderAPI
    private let calendar: Calendar

    public init(api: OrderAPI, calendar: Calendar = .japan) {
        self.api = api
        self.calendar = calendar
    }

    /// 読み込みが終わって、注文が1件もないとき（「注文はまだありません」を表示する）
    public var isEmpty: Bool {
        state.value?.isEmpty ?? false
    }

    /// 日本時間の月ごとのセクション（新しい月が先）
    public var sections: [OrderMonthSection] {
        let orders = state.value ?? []
        // state の注文は新しい順なので、まとめても順番は保たれる
        var sections: [OrderMonthSection] = []
        for order in orders {
            let title = monthTitle(order.orderedAt)
            if let last = sections.last, last.title == title {
                sections[sections.count - 1] = OrderMonthSection(title: title, orders: last.orders + [order])
            } else {
                sections.append(OrderMonthSection(title: title, orders: [order]))
            }
        }
        return sections
    }

    /// 読み込む（失敗したあとの「もう一度読み込む」も同じ）
    public func load() async {
        state = .loading
        do {
            let orders = try await api.fetchOrders()
            state = .loaded(orders.sorted { ($0.orderedAt, $0.id) > ($1.orderedAt, $1.id) })
        } catch {
            state = .failed(message: (error as? LocalizedError)?.errorDescription ?? "注文履歴を読み込めませんでした")
        }
    }

    private func monthTitle(_ date: Date) -> String {
        let components = calendar.dateComponents([.year, .month], from: date)
        return "\(components.year!)年\(components.month!)月"
    }
}
