// 課題のテスト（変更しないでください）。ポイント計算の不具合が直っていることを確かめる
import Testing
@testable import SakuraMartKit

@Suite("ポイント計算（不具合の修正の確認）")
struct PointCalculatorTaskTests {
    @Test("端数は切り捨てる")
    func floor() {
        #expect(PointCalculator.points(taxIncluded: 1250, rank: .regular) == 12)
        #expect(PointCalculator.points(taxIncluded: 1299, rank: .silver) == 12)
        #expect(PointCalculator.points(taxIncluded: 1275, rank: .gold) == 25)
    }
}
