class Admin::ProductsController < Admin::BaseController
  before_action :set_product, only: %i[edit update unpublish]

  def index
    @products = Product.includes(:category).order(:id)
  end

  def new
    @product = Product.new(published: true)
  end

  def create
    @product = Product.new(product_params)
    if @product.save
      redirect_to admin_products_path, notice: "「#{@product.name}」を登録しました"
    else
      render :new, status: :unprocessable_content
    end
  end

  def edit
  end

  def update
    if @product.update(product_params)
      redirect_to admin_products_path, notice: "「#{@product.name}」を更新しました"
    else
      render :edit, status: :unprocessable_content
    end
  end

  # 注文の履歴があるので商品は削除せず、非公開にする（会員向けAPIに出なくなる）
  def unpublish
    @product.update!(published: false)
    redirect_to admin_products_path, notice: "「#{@product.name}」を非公開にしました"
  end

  private
    def set_product
      @product = Product.find(params[:id])
    end

    # Strong Parameters: フォームから受け付ける項目だけを許可する
    def product_params
      params.expect(product: %i[name description price stock category_id published])
    end
end
