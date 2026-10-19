class Admin::ProductsController < Admin::BaseController
  def index
    @products = Product.includes(:category).order(:id)
  end

  def show
    @product = Product.includes(:category).find(params[:id])
  end
end
