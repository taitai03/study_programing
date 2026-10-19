require "rails_helper"

RSpec.describe "スタッフのログイン", type: :request do
  let(:user) { create(:user) }

  it "ログインしていなければ、管理画面からログイン画面に移動する" do
    get admin_root_path
    expect(response).to redirect_to(new_session_path)
  end

  it "正しいメールアドレスとパスワードでログインできる" do
    sign_in_as(user)
    expect(response).to redirect_to(admin_root_url)
    get admin_root_path
    expect(response).to have_http_status(:ok)
  end

  it "パスワードが違えばログインできない" do
    post session_path, params: { email_address: user.email_address, password: "wrong" }
    expect(response).to redirect_to(new_session_path)
    expect(flash[:alert]).to be_present
  end
end
