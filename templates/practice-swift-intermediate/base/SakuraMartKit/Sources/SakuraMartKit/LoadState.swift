/// 通信して読み込むデータの状態。画面で「読み込み中」「エラー」「表示」を出し分けるのに使う
public enum LoadState<Value> {
    case idle
    case loading
    case loaded(Value)
    case failed(message: String)

    public var value: Value? {
        if case .loaded(let value) = self { return value }
        return nil
    }

    public var isLoading: Bool {
        if case .loading = self { return true }
        return false
    }
}

extension LoadState: Equatable where Value: Equatable {}
extension LoadState: Sendable where Value: Sendable {}
