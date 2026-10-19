# 課題のテスト（変更しないでください）
require "rails_helper"

RSpec.describe "社内備品の貸出管理" do
  let(:today) { Date.new(2026, 4, 15) }
  let(:staff) { create(:user, name: "店舗 たろう") }
  let(:projector) { OfficeItem.create!(name: "プロジェクター", management_number: "EQ-0001") }

  around { |example| travel_to(today.in_time_zone.change(hour: 10)) { example.run } }

  describe OfficeItem do
    it "名前と管理番号は必須。管理番号は重複できない" do
      expect(OfficeItem.new(name: "", management_number: "")).not_to be_valid
      projector
      dup = OfficeItem.new(name: "別のプロジェクター", management_number: "EQ-0001")
      expect(dup).not_to be_valid
      expect(dup.errors[:management_number]).to be_present
    end

    it "貸出中でなければ available? が true。current_loan は返却されていない貸出" do
      expect(projector.available?).to be(true)
      expect(projector.current_loan).to be_nil
      loan = projector.loans.create!(user: staff, due_on: today + 7)
      expect(projector.reload.available?).to be(false)
      expect(projector.current_loan).to eq(loan)
    end
  end

  describe Loan do
    it "返却予定日は必須で、今日から30日後まで" do
      expect(projector.loans.new(user: staff, due_on: nil)).not_to be_valid
      expect(projector.loans.new(user: staff, due_on: today - 1)).not_to be_valid
      expect(projector.loans.new(user: staff, due_on: today)).to be_valid
      expect(projector.loans.new(user: staff, due_on: today + 30)).to be_valid
      expect(projector.loans.new(user: staff, due_on: today + 31)).not_to be_valid
    end

    it "貸出中の備品は貸し出せない" do
      projector.loans.create!(user: staff, due_on: today + 7)
      loan = projector.loans.new(user: create(:user), due_on: today + 3)
      expect(loan).not_to be_valid
      expect(loan.errors[:base]).to include("この備品は貸出中です")
    end

    it "返却すると returned_at が記録され、また貸し出せる。返却済みの貸出は返却できない" do
      loan = projector.loans.create!(user: staff, due_on: today + 7)
      loan.return!
      expect(loan.reload.returned_at).to be_present
      expect(projector.reload.available?).to be(true)
      expect { loan.return! }.to raise_error(Loan::AlreadyReturned)
    end

    it "返却予定日を過ぎても返却されていない貸出は overdue?。scope の overdue でも取れる" do
      loan = projector.loans.create!(user: staff, due_on: today + 1)
      expect(loan.overdue?).to be(false)
      # 2日後にする
      travel_back
      travel_to((today + 2).in_time_zone.change(hour: 10))
      expect(loan.overdue?).to be(true)
      expect(Loan.overdue).to eq([ loan ])
      loan.return!
      expect(loan.overdue?).to be(false)
      expect(Loan.overdue).to eq([])
    end

    it "scope の active は、返却されていない貸出" do
      returned = projector.loans.create!(user: staff, due_on: today + 1)
      returned.return!
      active = projector.loans.create!(user: staff, due_on: today + 1)
      expect(Loan.active).to eq([ active ])
    end
  end

  describe "管理画面", type: :request do
    before { sign_in_as(staff) }

    it "備品の一覧に、貸出の状態（貸出可・貸出中・期限切れ）を表示する" do
      camera = OfficeItem.create!(name: "デジタルカメラ", management_number: "EQ-0002")
      OfficeItem.create!(name: "延長コード", management_number: "EQ-0003")
      projector.loans.create!(user: staff, due_on: today + 7)
      overdue = camera.loans.create!(user: staff, due_on: today)
      overdue.update_columns(due_on: today - 1)

      get "/admin/office_items"
      expect(response).to have_http_status(:ok)
      expect(response.body).to include("プロジェクター", "EQ-0001", "貸出中", "店舗 たろう", "2026/04/22")
      expect(response.body).to include("デジタルカメラ", "期限切れ")
      expect(response.body).to include("延長コード", "貸出可")
    end

    it "備品を登録できる。誤りがあれば 422" do
      expect {
        post "/admin/office_items", params: { office_item: { name: "ホワイトボード", management_number: "EQ-0010" } }
      }.to change(OfficeItem, :count).by(1)
      expect(response).to redirect_to("/admin/office_items")

      post "/admin/office_items", params: { office_item: { name: "", management_number: "" } }
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "備品を貸し出せる。貸し出せなければ一覧に戻ってエラーを表示する" do
      borrower = create(:user, name: "店舗 はなこ")
      post "/admin/office_items/#{projector.id}/loans", params: { loan: { user_id: borrower.id, due_on: "2026-04-20" } }
      expect(response).to redirect_to("/admin/office_items")
      expect(projector.current_loan).to have_attributes(user: borrower, due_on: Date.new(2026, 4, 20))

      post "/admin/office_items/#{projector.id}/loans", params: { loan: { user_id: staff.id, due_on: "2026-04-20" } }
      expect(response).to redirect_to("/admin/office_items")
      follow_redirect!
      expect(response.body).to include("この備品は貸出中です")
    end

    it "返却できる" do
      loan = projector.loans.create!(user: staff, due_on: today + 7)
      patch "/admin/loans/#{loan.id}/return"
      expect(response).to redirect_to("/admin/office_items")
      expect(loan.reload.returned_at).to be_present
    end

    it "ログインしていなければ使えない" do
      delete session_path
      get "/admin/office_items"
      expect(response).to redirect_to(new_session_path)
    end
  end
end
