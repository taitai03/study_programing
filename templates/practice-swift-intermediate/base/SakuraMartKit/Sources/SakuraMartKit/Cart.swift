/// カートの1行（商品と数量）
public struct CartItem: Identifiable, Hashable, Sendable {
    public let product: Product
    public var quantity: Int

    public var id: Int { product.id }
    /// 税抜の金額
    public var amount: Int { product.price * quantity }

    public init(product: Product, quantity: Int) {
        self.product = product
        self.quantity = quantity
    }
}

/// カート。同じ商品は1行にまとめる
public struct Cart: Hashable, Sendable {
    public static let maxQuantity = 99

    public private(set) var items: [CartItem] = []

    public init(items: [CartItem] = []) {
        self.items = items
    }

    public var isEmpty: Bool { items.isEmpty }
    public var totalQuantity: Int { items.reduce(0) { $0 + $1.quantity } }

    /// 商品を追加する。すでにあれば数量を足す（最大99個）
    public mutating func add(_ product: Product, quantity: Int = 1) {
        guard quantity > 0 else { return }
        if let index = items.firstIndex(where: { $0.product.id == product.id }) {
            items[index].quantity = min(items[index].quantity + quantity, Self.maxQuantity)
        } else {
            items.append(CartItem(product: product, quantity: min(quantity, Self.maxQuantity)))
        }
    }

    /// 数量を変える。0以下なら取り除く
    public mutating func setQuantity(_ quantity: Int, for productID: Int) {
        guard let index = items.firstIndex(where: { $0.product.id == productID }) else { return }
        if quantity <= 0 {
            items.remove(at: index)
        } else {
            items[index].quantity = min(quantity, Self.maxQuantity)
        }
    }

    public mutating func remove(productID: Int) {
        items.removeAll { $0.product.id == productID }
    }

    public mutating func removeAll() {
        items.removeAll()
    }
}
