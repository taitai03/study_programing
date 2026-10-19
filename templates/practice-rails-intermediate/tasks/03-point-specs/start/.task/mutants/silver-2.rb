# バグ: シルバー会員が2%になっている
# 注文で付与するポイント（業務仕様 3.3）
module PointCalculator
  # 付与するポイントの率（%）。ゴールド会員だけ2%
  RATES = { "regular" => 1, "silver" => 2, "gold" => 2 }.freeze

  module_function

  # tax_included は割引と消費税を反映した金額（送料を含まない）。端数は切り捨て
  def points(tax_included, rank)
    return 0 if tax_included <= 0

    tax_included * RATES.fetch(rank.to_s) / 100
  end
end
