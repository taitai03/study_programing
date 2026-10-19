# 会員向けAPIの親クラス。Authorization: Bearer <APIトークン> で会員を認証する
class Api::V1::BaseController < ActionController::API
  include ActionController::HttpAuthentication::Token::ControllerMethods

  rescue_from ActiveRecord::RecordNotFound do
    render json: { error: "見つかりません" }, status: :not_found
  end

  private
    def current_member
      @current_member ||= authenticate_with_http_token do |token, _options|
        Member.find_by(api_token: token)
      end
    end

    def require_member!
      render json: { error: "APIトークンが正しくありません" }, status: :unauthorized unless current_member
    end
end
