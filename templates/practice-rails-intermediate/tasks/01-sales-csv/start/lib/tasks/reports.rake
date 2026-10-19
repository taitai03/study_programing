namespace :reports do
  desc "月別・商品別の売上CSVを作る（例: bin/rails reports:monthly_sales INPUT=data/order-lines-sample.csv OUTPUT=output/monthly-sales.csv）"
  task monthly_sales: :environment do
    input = ENV.fetch("INPUT") { abort "INPUT に注文明細CSVのパスを指定してください" }
    output = ENV.fetch("OUTPUT") { abort "OUTPUT に出力先のパスを指定してください" }

    csv = MonthlySalesReport.build(File.read(input))
    FileUtils.mkdir_p(File.dirname(output))
    File.write(output, csv)
    puts "#{output} に出力しました"
  end
end
