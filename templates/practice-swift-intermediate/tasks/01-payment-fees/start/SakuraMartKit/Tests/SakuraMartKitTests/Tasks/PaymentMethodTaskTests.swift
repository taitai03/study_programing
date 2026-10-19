// 課題のテスト（変更しないでください）
import Testing
@testable import SakuraMartKit

@Suite("支払い方法と手数料")
struct PaymentMethodTaskTests {
    @Test("クレジットカード: 手数料は0円、金額の上限はない")
    func creditCard() {
        let card = CreditCardPayment()
        #expect(card.name == "クレジットカード")
        #expect(card.fee(for: 3_000) == 0)
        #expect(card.maxAmount == nil)
        #expect(card.canPay(10_000_000))
    }

    @Test("コンビニ払い: 1万円未満は220円、1万円以上は330円。30万円まで")
    func convenienceStore() {
        let store = ConvenienceStorePayment()
        #expect(store.name == "コンビニ払い")
        #expect(store.fee(for: 9_999) == 220)
        #expect(store.fee(for: 10_000) == 330)
        #expect(store.maxAmount == 300_000)
        #expect(store.canPay(300_000))
        #expect(!store.canPay(300_001))
    }

    @Test("後払い: 手数料は一律330円。5万5千円まで")
    func deferred() {
        let deferred = DeferredPayment()
        #expect(deferred.name == "後払い")
        #expect(deferred.fee(for: 1_000) == 330)
        #expect(deferred.fee(for: 50_000) == 330)
        #expect(deferred.canPay(55_000))
        #expect(!deferred.canPay(55_001))
    }

    @Test("どの支払い方法でも、手数料を足した合計を出せる（プロトコルの拡張）")
    func totalWithFee() {
        let methods: [any PaymentMethod] = [CreditCardPayment(), ConvenienceStorePayment(), DeferredPayment()]
        #expect(methods.map { $0.totalWithFee(for: 12_000) } == [12_000, 12_330, 12_330])
    }

    @Test("金額が0円以下なら、どの支払い方法も使えない")
    func zeroAmount() {
        #expect(!CreditCardPayment().canPay(0))
        #expect(!ConvenienceStorePayment().canPay(-1))
    }

    @Test("使える支払い方法を、カード → コンビニ → 後払いの順に返す")
    func available() {
        #expect(PaymentOptions.available(for: 50_000).map(\.name) == ["クレジットカード", "コンビニ払い", "後払い"])
        #expect(PaymentOptions.available(for: 60_000).map(\.name) == ["クレジットカード", "コンビニ払い"])
        #expect(PaymentOptions.available(for: 400_000).map(\.name) == ["クレジットカード"])
        #expect(PaymentOptions.available(for: 0).isEmpty)
    }

    @Test("新しい支払い方法は、PaymentMethod に準拠すれば同じように使える")
    func customMethod() {
        struct PointPayment: PaymentMethod {
            let name = "ポイント払い"
            func fee(for amount: Int) -> Int { 0 }
        }
        let point = PointPayment()
        #expect(point.maxAmount == nil)
        #expect(point.canPay(100))
        #expect(point.totalWithFee(for: 100) == 100)
    }
}
