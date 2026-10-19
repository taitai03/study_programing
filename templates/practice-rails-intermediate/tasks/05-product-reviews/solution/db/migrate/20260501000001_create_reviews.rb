class CreateReviews < ActiveRecord::Migration[8.1]
  def change
    create_table :reviews do |t|
      t.references :product, null: false, foreign_key: true
      t.references :member, null: false, foreign_key: true
      # 1〜5
      t.integer :rating, null: false
      t.text :body

      t.timestamps
    end
    # 同じ会員は、同じ商品に1つだけ
    add_index :reviews, %i[member_id product_id], unique: true
  end
end
