class CreateOfficeItemsAndLoans < ActiveRecord::Migration[8.1]
  def change
    create_table :office_items do |t|
      t.string :name, null: false
      # 備品に貼ってある管理番号（例: EQ-0001）
      t.string :management_number, null: false
      t.text :note
      t.timestamps
    end
    add_index :office_items, :management_number, unique: true

    create_table :loans do |t|
      t.references :office_item, null: false, foreign_key: true
      # 借りた人（スタッフ）
      t.references :user, null: false, foreign_key: true
      t.date :due_on, null: false
      t.datetime :returned_at
      t.timestamps
    end
  end
end
