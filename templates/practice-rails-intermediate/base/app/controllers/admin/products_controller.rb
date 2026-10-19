class Admin::ProductsController < Admin::BaseController
  def index
    @products = Product.includes(:category).order(:id)
  end
end
