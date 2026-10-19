class Admin::OfficeItemsController < Admin::BaseController
  def index
    @office_items = OfficeItem.includes(loans: :user).order(:management_number)
    @staff = User.order(:id)
  end

  def new
    @office_item = OfficeItem.new
  end

  def create
    @office_item = OfficeItem.new(params.expect(office_item: %i[name management_number note]))
    if @office_item.save
      redirect_to admin_office_items_path, notice: "「#{@office_item.name}」を登録しました"
    else
      render :new, status: :unprocessable_content
    end
  end
end
