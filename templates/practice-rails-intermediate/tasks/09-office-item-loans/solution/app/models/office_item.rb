# 社内の備品（プロジェクター、カメラなど）
class OfficeItem < ApplicationRecord
  has_many :loans, dependent: :destroy

  validates :name, presence: true
  validates :management_number, presence: true, uniqueness: true

  # いま貸し出している（返却されていない）貸出
  def current_loan
    loans.active.order(:created_at).last
  end

  def available?
    current_loan.nil?
  end
end
