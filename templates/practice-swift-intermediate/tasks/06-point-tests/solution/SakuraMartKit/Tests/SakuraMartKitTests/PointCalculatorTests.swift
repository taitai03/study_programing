import Testing
@testable import SakuraMartKit

@Suite("ポイント計算")
struct PointCalculatorTests {
    @Test("一般・シルバーは1%、ゴールドは2%", arguments: [
        (MemberRank.regular, 100),
        (.silver, 100),
        (.gold, 200),
    ])
    func rate(rank: MemberRank, expected: Int) {
        #expect(PointCalculator.points(taxIncluded: 10_000, rank: rank) == expected)
    }

    @Test("端数は切り捨てる（四捨五入でも切り上げでもない）", arguments: [
        (1250, MemberRank.regular, 12),
        (1201, .regular, 12),
        (1299, .regular, 12),
        (149, .gold, 2),
    ])
    func floor(amount: Int, rank: MemberRank, expected: Int) {
        #expect(PointCalculator.points(taxIncluded: amount, rank: rank) == expected)
    }

    @Test("1ポイントに満たない金額は0")
    func belowOne() {
        #expect(PointCalculator.points(taxIncluded: 99, rank: .regular) == 0)
    }

    @Test("金額が0以下なら0")
    func zeroOrNegative() {
        #expect(PointCalculator.points(taxIncluded: 0, rank: .gold) == 0)
        #expect(PointCalculator.points(taxIncluded: -500, rank: .regular) == 0)
    }
}
