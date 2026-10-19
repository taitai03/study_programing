require "rails_helper"

RSpec.describe Coupon do
  let(:now) { Time.zone.parse("2026-04-15 12:00") }
  let(:coupon) { build(:coupon, discount_value: 500, min_amount: 1000, starts_at: now - 1.day, ends_at: now + 1.day) }

  describe "#discount_for" do
    it "定額: 割引の値をそのまま引く。金額より大きい場合は金額まで" do
      expect(coupon.discount_for(1200, now:)).to eq(500)
      coupon.discount_value = 5000
      expect(coupon.discount_for(1200, now:)).to eq(1200)
    end

    it "定率: 金額の割合を切り捨てで引く" do
      coupon.assign_attributes(discount_type: "percent", discount_value: 15)
      expect(coupon.discount_for(1999, now:)).to eq(299)
    end

    it "期間外や最低購入金額未満なら NotApplicable" do
      expect { coupon.discount_for(999, now:) }.to raise_error(Coupon::NotApplicable)
      expect { coupon.discount_for(1200, now: now + 2.days) }.to raise_error(Coupon::NotApplicable, /終わっています/)
      expect { coupon.discount_for(1200, now: now - 2.days) }.to raise_error(Coupon::NotApplicable, /期間前/)
    end
  end
end
