class CreateCoupons < ActiveRecord::Migration[8.1]
  def change
    create_table :coupons do |t|
      t.string :code, null: false
      # fixed: 定額（円）、percent: 定率（%）
      t.string :discount_type, null: false
      t.integer :discount_value, null: false
      # ランク割引のあとの金額で判定する
      t.integer :min_amount, null: false, default: 0
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.timestamps
    end
    add_index :coupons, :code, unique: true
  end
end
