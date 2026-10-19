class CreateCategoriesAndProducts < ActiveRecord::Migration[8.1]
  def change
    create_table :categories do |t|
      t.string :name, null: false
      t.timestamps
    end
    add_index :categories, :name, unique: true

    create_table :products do |t|
      t.string :name, null: false
      t.text :description, null: false, default: ""
      # 税抜の価格（円）
      t.integer :price, null: false
      t.references :category, null: false, foreign_key: true
      t.boolean :published, null: false, default: true
      t.integer :stock, null: false, default: 0
      t.timestamps
    end
  end
end
