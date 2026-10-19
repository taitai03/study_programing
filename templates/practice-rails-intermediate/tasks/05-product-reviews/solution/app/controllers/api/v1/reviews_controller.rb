# 会員向け: 商品のレビューを書く
class Api::V1::ReviewsController < Api::V1::BaseController
  before_action :require_member!

  def create
    product = Product.published.find(params[:product_id])
    review = product.reviews.new(member: current_member, **params.permit(:rating, :body).to_h.symbolize_keys)

    if review.save
      render json: { review: review.as_json(only: %i[id product_id rating body created_at]) }, status: :created
    else
      render json: { errors: review.errors.to_hash }, status: :unprocessable_content
    end
  end
end
