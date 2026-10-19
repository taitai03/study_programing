# 開発用の初期データを入れる。実行: bin/rails db:seed（入れ直すときは bin/rails db:reset）
if Product.exists?
  puts "すでにデータがあります。入れ直すときは bin/rails db:reset を実行してください"
else
  SampleData.load!
  puts "初期データを入れました（スタッフ: admin@sakura-mart.example / password）"
end
