import SakuraMartKit
import SwiftUI

/// カート。数量の変更と、合計金額の表示
struct CartView: View {
    @Environment(CartViewModel.self) private var viewModel

    var body: some View {
        Group {
            if viewModel.cart.isEmpty {
                ContentUnavailableView("カートは空です", systemImage: "cart")
            } else {
                List {
                    Section {
                        ForEach(viewModel.cart.items) { item in
                            CartItemRow(item: item)
                        }
                        .onDelete { offsets in
                            for index in offsets {
                                viewModel.remove(productID: viewModel.cart.items[index].product.id)
                            }
                        }
                    }
                    Section("お支払い金額（\(viewModel.rank.label)会員）") {
                        let breakdown = viewModel.breakdown
                        LabeledContent("小計", value: formatYen(breakdown.subtotal))
                        LabeledContent("会員ランク割引", value: "-" + formatYen(breakdown.rankDiscount))
                        if breakdown.couponDiscount > 0 {
                            LabeledContent("クーポン割引", value: "-" + formatYen(breakdown.couponDiscount))
                        }
                        LabeledContent("消費税", value: formatYen(breakdown.tax))
                        LabeledContent("送料", value: formatYen(breakdown.shippingFee))
                        LabeledContent("合計", value: formatYen(breakdown.total))
                            .bold()
                        LabeledContent("付与ポイント", value: "\(breakdown.points)pt")
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .navigationTitle("カート")
    }
}

struct CartItemRow: View {
    let item: CartItem
    @Environment(CartViewModel.self) private var viewModel

    var body: some View {
        VStack(alignment: .leading) {
            Text(item.product.name)
            Stepper(
                "\(item.quantity)個 × \(formatYen(item.product.price))",
                value: Binding(
                    get: { item.quantity },
                    set: { viewModel.setQuantity($0, for: item.product.id) }
                ),
                in: 0...Cart.maxQuantity
            )
            .font(.callout)
        }
    }
}
