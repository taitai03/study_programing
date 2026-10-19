# 管理画面のコントローラーの親クラス。ログインしたスタッフだけが使える（Authentication）
class Admin::BaseController < ApplicationController
  layout "admin"

  private
    def current_user
      Current.session&.user
    end
    helper_method :current_user
end
