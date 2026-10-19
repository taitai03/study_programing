# スタッフ（管理画面にログインする人）
class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :loans, dependent: :restrict_with_error

  enum :role, { admin: "admin", staff: "staff" }, default: "staff"

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  validates :name, presence: true
  validates :email_address, presence: true, uniqueness: true
end
