require "rails_helper"

RSpec.describe Loan do
  let(:item) { OfficeItem.create!(name: "プロジェクター", management_number: "EQ-0001") }
  let(:staff) { create(:user) }

  it "返却予定日を過ぎた貸出も返却できる" do
    loan = item.loans.create!(user: staff, due_on: Date.current)
    travel_to(3.days.from_now) do
      expect(loan.overdue?).to be(true)
      expect { loan.return! }.not_to raise_error
    end
  end
end
