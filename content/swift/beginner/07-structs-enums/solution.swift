/// 注文ステータス
enum OrderStatus {
    case pending    // 受付
    case paid       // 支払済
    case shipped    // 発送済
    case delivered  // 完了
    case cancelled  // キャンセル

    var label: String {
        switch self {
        case .pending: return "受付"
        case .paid: return "支払済"
        case .shipped: return "発送済"
        case .delivered: return "完了"
        case .cancelled: return "キャンセル"
        }
    }

    var canCancel: Bool {
        switch self {
        case .pending, .paid: return true
        case .shipped, .delivered, .cancelled: return false
        }
    }
}

struct Product {
    let name: String
    let price: Int

    var priceWithTax: Int {
        price * 110 / 100
    }
}

struct CartItem {
    let product: Product
    var quantity: Int
}

struct Cart {
    var items: [CartItem] = []

    mutating func add(_ product: Product, quantity: Int = 1) {
        if let index = items.firstIndex(where: { $0.product.name == product.name }) {
            items[index].quantity += quantity
        } else {
            items.append(CartItem(product: product, quantity: quantity))
        }
    }

    var itemCount: Int {
        var count = 0
        for item in items {
            count += item.quantity
        }
        return count
    }

    var subtotal: Int {
        items.map { $0.product.price * $0.quantity }.reduce(0, +)
    }
}

// MARK: - セルフチェック（ここは変更しないでください）
check("受付の表示名", OrderStatus.pending.label, "受付")
check("支払済の表示名", OrderStatus.paid.label, "支払済")
check("発送済の表示名", OrderStatus.shipped.label, "発送済")
check("完了の表示名", OrderStatus.delivered.label, "完了")
check("キャンセルの表示名", OrderStatus.cancelled.label, "キャンセル")
check("受付・支払済はキャンセルできる", [OrderStatus.pending, .paid].map { $0.canCancel }, [true, true])
check("発送済・完了・キャンセル済みはキャンセルできない", [OrderStatus.shipped, .delivered, .cancelled].map { $0.canCancel }, [false, false, false])

let juice = Product(name: "国産りんごジュース 1L", price: 398)
let bread = Product(name: "ふっくら食パン", price: 248)
check("398円の商品の税込価格が437円", juice.priceWithTax, 437)

var sameCart = Cart()
sameCart.add(juice, quantity: 2)
sameCart.add(juice)
check("同じ商品を2回入れると行は1つのまま", sameCart.items.count, 1)
check("同じ商品を2回入れると数量が増える", sameCart.itemCount, 3)

var cart = Cart()
cart.add(juice, quantity: 3)
cart.add(bread, quantity: 2)
check("りんごジュース3個と食パン2個で数量5", cart.itemCount, 5)
check("りんごジュース3個と食パン2個で小計1,690円", cart.subtotal, 1690)

var copied = cart
copied.add(juice)
check("コピーしたかごに入れても、もとのかごは変わらない", cart.itemCount, 5)
check("コピーしたかごの数量は増える", copied.itemCount, 6)
