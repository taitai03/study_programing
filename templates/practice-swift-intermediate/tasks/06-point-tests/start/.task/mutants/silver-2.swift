// バグ: シルバー会員が2%になっている
/// 注文で付与するポイント（業務仕様 3.3）
public enum PointCalculator {
    /// 付与するポイントの率（%）。ゴールド会員だけ2%
    public static func rate(for rank: MemberRank) -> Int {
        switch rank {
        case .regular: 1
        case .silver, .gold: 2
        }
    }

    /// taxIncluded は割引と消費税を反映した金額（送料を含まない）。端数は切り捨て
    public static func points(taxIncluded: Int, rank: MemberRank) -> Int {
        guard taxIncluded > 0 else { return 0 }
        return taxIncluded * rate(for: rank) / 100
    }
}
