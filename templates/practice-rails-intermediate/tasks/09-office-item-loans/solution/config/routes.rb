Rails.application.routes.draw do
  # スタッフのログイン・ログアウト
  resource :session, only: %i[new create destroy]

  # 管理画面（スタッフ向け）
  namespace :admin do
    root "dashboard#show"
    resources :products, only: %i[index]
    resources :orders, only: %i[index show]
    resources :office_items, only: %i[index new create] do
      resources :loans, only: %i[create]
    end
    resources :loans, only: [] do
      member do
        patch :return
      end
    end
  end

  # 会員向けAPI（Authorization: Bearer <APIトークン>）
  namespace :api do
    namespace :v1 do
      resources :products, only: %i[index show]
      resources :orders, only: %i[create]
      namespace :me do
        resources :orders, only: %i[index]
      end
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
  root to: redirect("/admin")
end
