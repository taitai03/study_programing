# 課題のテスト（変更しないでください）
require "rails_helper"

RSpec.describe "管理画面: 注文の絞り込みと JSON API", type: :request do
  before { sign_in_as(create(:user)) }

  def ids(params = {})
    get "/admin/orders.json", params: params
    expect(response).to have_http_status(:ok)
    response.parsed_body["orders"].map { |o| o["id"] }
  end

  let!(:mar31) { create(:order, ordered_at: Time.zone.parse("2026-03-31 23:59:59"), status: "completed") }
  let!(:apr01) { create(:order, ordered_at: Time.zone.parse("2026-04-01 00:00:00"), status: "paid") }
  let!(:apr10) { create(:order, ordered_at: Time.zone.parse("2026-04-10 12:00"), status: "cancelled") }
  let!(:apr15) { create(:order, ordered_at: Time.zone.parse("2026-04-15 23:59:59"), status: "paid") }
  let!(:apr16) { create(:order, ordered_at: Time.zone.parse("2026-04-16 00:00:00"), status: "completed") }

  describe "GET /admin/orders.json" do
    it "条件がなければ、すべての注文を新しい順に返す。JSON の形は仕様のとおり" do
      expect(ids).to eq([ apr16, apr15, apr10, apr01, mar31 ].map(&:id))
      order = response.parsed_body["orders"].first
      expect(order.keys).to contain_exactly("id", "member", "status", "total", "ordered_at")
      expect(order["member"].keys).to contain_exactly("id", "name")
      expect(response.parsed_body).to include("page" => 1, "total_pages" => 1, "total_count" => 5)
    end

    it "from と to（日本時間の日付）で、その期間（両端の日を含む）の注文に絞り込む" do
      expect(ids(from: "2026-04-01", to: "2026-04-15")).to eq([ apr15, apr10, apr01 ].map(&:id))
      expect(ids(from: "2026-04-16")).to eq([ apr16.id ])
      expect(ids(to: "2026-03-31")).to eq([ mar31.id ])
    end

    it "status で絞り込む。期間と組み合わせられる" do
      expect(ids(status: "paid")).to eq([ apr15, apr01 ].map(&:id))
      expect(ids(status: "completed", from: "2026-04-01")).to eq([ apr16.id ])
    end

    it "空の値の条件は、指定がないものとして扱う" do
      expect(ids(from: "", to: "", status: "")).to eq([ apr16, apr15, apr10, apr01, mar31 ].map(&:id))
    end

    it "50件ずつページに分ける" do
      create_list(:order, 50, ordered_at: Time.zone.parse("2026-05-01 10:00"))
      first = ids
      expect(first.size).to eq(50)
      expect(response.parsed_body).to include("page" => 1, "total_pages" => 2, "total_count" => 55)
      second = ids(page: 2)
      expect(second).to eq([ apr16, apr15, apr10, apr01, mar31 ].map(&:id))
      expect(ids(status: "paid", page: 2)).to eq([])
    end

    [
      [ "日付の形式が違う", { from: "2026/04/01" } ],
      [ "存在しない日付", { to: "2026-02-30" } ],
      [ "from が to より後", { from: "2026-04-15", to: "2026-04-01" } ],
      [ "知らないステータス", { status: "refunded" } ]
    ].each do |name, params|
      it "#{name}: 400 で理由を返す" do
        get "/admin/orders.json", params: params
        expect(response).to have_http_status(:bad_request)
        expect(response.parsed_body["error"]).to be_a(String).and(be_present)
      end
    end
  end

  describe "GET /admin/orders（画面）" do
    it "同じ条件で絞り込んで表示する" do
      get "/admin/orders", params: { status: "cancelled" }
      expect(response).to have_http_status(:ok)
      expect(response.body).to include("##{apr10.id}")
      expect(response.body).not_to include("##{apr15.id}")
    end

    it "絞り込みのフォーム（期間とステータス）がある" do
      get "/admin/orders"
      %w[from to status].each { |name| expect(response.body).to include(%(name="#{name}")) }
    end

    it "条件が正しくなければ 400 で、理由を表示する" do
      get "/admin/orders", params: { from: "2026-13-01" }
      expect(response).to have_http_status(:bad_request)
      expect(response.body).to include("日付")
    end
  end

  it "ログインしていなければ JSON も使えない" do
    delete session_path
    get "/admin/orders.json"
    expect(response).not_to have_http_status(:ok)
  end
end
