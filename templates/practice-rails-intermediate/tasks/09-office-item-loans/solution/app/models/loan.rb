# 備品の貸出。返却すると returned_at が入る
class Loan < ApplicationRecord
  # 返却済みの貸出を、もう一度返却しようとしたとき
  class AlreadyReturned < StandardError; end

  MAX_DAYS = 30

  belongs_to :office_item
  belongs_to :user

  scope :active, -> { where(returned_at: nil) }
  scope :overdue, -> { active.where(due_on: ...Date.current) }

  validates :due_on, presence: true
  # 期限と貸出中のチェックは、貸し出すときだけ（返却するときは、期限を過ぎていても返却できる）
  validate :due_on_within_range, on: :create
  validate :office_item_must_be_available, on: :create

  def overdue?
    returned_at.nil? && due_on < Date.current
  end

  def return!
    raise AlreadyReturned, "この貸出はすでに返却されています" if returned_at

    update!(returned_at: Time.current)
  end

  private
    def due_on_within_range
      return if due_on.nil?

      if due_on < Date.current
        errors.add(:due_on, "は今日以降の日付にしてください")
      elsif due_on > Date.current + MAX_DAYS
        errors.add(:due_on, "は#{MAX_DAYS}日後までにしてください")
      end
    end

    def office_item_must_be_available
      errors.add(:base, "この備品は貸出中です") if office_item && !office_item.available?
    end
end
