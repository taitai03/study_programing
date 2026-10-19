# 会員（会員向けAPIを使う人）
class CreateMembers < ActiveRecord::Migration[8.1]
  def change
    create_table :members do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :rank, null: false, default: "regular"
      t.integer :points, null: false, default: 0
      # 会員向けAPIの認証に使うトークン
      t.string :api_token, null: false
      t.timestamps
    end
    add_index :members, :email, unique: true
    add_index :members, :api_token, unique: true
  end
end
