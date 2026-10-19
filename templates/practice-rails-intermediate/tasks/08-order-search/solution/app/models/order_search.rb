# 注文一覧の検索条件（期間、ステータス、ページ）。画面と JSON API で同じものを使う
class OrderSearch
  include ActiveModel::Model
  include ActiveModel::Attributes

  PER_PAGE = 50
  DATE_FORMAT = /\A\d{4}-\d{2}-\d{2}\z/

  attribute :from, :string
  attribute :to, :string
  attribute :status, :string
  attribute :page, :integer

  validate :validate_dates
  validates :status, inclusion: { in: Order.statuses.keys, message: "は #{Order.statuses.keys.join(' / ')} のどれかを指定してください" },
                     allow_blank: true

  def self.model_name
    ActiveModel::Name.new(self, nil, "OrderSearch")
  end

  def from_date = parse_date(from)
  def to_date = parse_date(to)

  def current_page
    [ page.to_i, 1 ].max
  end

  # 条件に合う注文（新しい順）
  def scope
    orders = Order.recent.includes(:member)
    orders = orders.ordered_from(from_date) if from_date
    orders = orders.ordered_until(to_date) if to_date
    orders = orders.where(status:) if status.present?
    orders
  end

  def results
    scope.limit(PER_PAGE).offset((current_page - 1) * PER_PAGE)
  end

  def total_count
    @total_count ||= scope.count
  end

  def total_pages
    [ (total_count / PER_PAGE.to_f).ceil, 1 ].max
  end

  # ページを移動するリンクに付けるクエリ（空の条件は含めない）
  def to_query(page:)
    { from:, to:, status:, page: }.compact_blank
  end

  private
    def parse_date(value)
      return nil if value.blank? || value !~ DATE_FORMAT

      Date.strptime(value, "%Y-%m-%d")
    rescue Date::Error
      nil
    end

    def validate_dates
      { from: "from", to: "to" }.each do |attr, label|
        value = public_send(attr)
        next if value.blank? || parse_date(value)

        errors.add(:base, "#{label} の日付が正しくありません（YYYY-MM-DD の形式の、存在する日付を指定してください）")
      end
      if from_date && to_date && from_date > to_date
        errors.add(:base, "from は to 以前の日付にしてください")
      end
    end
end
