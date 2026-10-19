class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.references :member, null: false, foreign_key: true
      t.references :coupon, foreign_key: true
      t.string :status, null: false, default: "pending"
      # 金額はすべて円（業務仕様 3.3）
      t.integer :subtotal, null: false
      t.integer :rank_discount, null: false
      t.integer :coupon_discount, null: false
      t.integer :tax, null: false
      t.integer :shipping_fee, null: false
      t.integer :total, null: false
      t.integer :points_earned, null: false
      t.datetime :ordered_at, null: false
      t.timestamps
    end
    add_index :orders, :ordered_at
    add_index :orders, :status

    create_table :order_items do |t|
      t.references :order, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.integer :quantity, null: false
      # 注文した時点の価格（税抜）
      t.integer :unit_price, null: false
      t.timestamps
    end
  end
end
