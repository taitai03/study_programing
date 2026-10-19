# 会員向け: 公開中の商品
class Api::V1::ProductsController < Api::V1::BaseController
  def index
    products = Product.published.includes(:category).order(:id)
    render json: { products: products.map { |p| product_json(p) } }
  end

  def show
    render json: { product: product_json(Product.published.find(params[:id])) }
  end

  private
    def product_json(product)
      product.slice(:id, :name, :description, :price).merge(category: product.category.name)
    end
end
