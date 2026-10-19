import Testing
@testable import SakuraMartKit

@Suite("カート")
struct CartTests {
    let tea = Product(id: 11, name: "静岡煎茶 100g", description: "", price: 1080, category: "飲料")
    let rice = Product(id: 1, name: "国産こしひかり 5kg", description: "", price: 2980, category: "食品")

    @Test("同じ商品は1行にまとめ、数量を足す")
    func addSameProduct() {
        var cart = Cart()
        cart.add(tea)
        cart.add(tea, quantity: 2)
        cart.add(rice)
        #expect(cart.items.map(\.quantity) == [3, 1])
        #expect(cart.totalQuantity == 4)
    }

    @Test("数量は99個まで。0にすると取り除く")
    func quantityLimits() {
        var cart = Cart()
        cart.add(tea, quantity: 120)
        #expect(cart.items.first?.quantity == 99)
        cart.setQuantity(0, for: tea.id)
        #expect(cart.isEmpty)
    }
}
