// 月別・商品別の売上CSVを作る。
// 実行: npx tsx scripts/sales-csv.ts data/order-lines-sample.csv output/monthly-sales.csv
import fs from "node:fs";
import path from "node:path";
import { buildMonthlySalesCsv } from "@/reports/sales-csv";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("使い方: npx tsx scripts/sales-csv.ts <注文明細CSV> <出力先>");
  process.exit(1);
}

const csv = buildMonthlySalesCsv(fs.readFileSync(input, "utf8"));
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, csv);
console.log(`${output} に出力しました`);
