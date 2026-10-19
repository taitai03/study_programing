// 開発用の初期データを入れる。実行: npm run db:seed（入れ直すときは npm run db:reset）
import { db } from "@/db";
import { products } from "@/db/schema";
import { seed } from "@/db/seed";

async function main() {
  if ((await db.$count(products)) > 0) {
    console.log("すでにデータがあります。入れ直すときは npm run db:reset を実行してください");
    return;
  }
  seed(db, { members: 200, orders: 2000, now: new Date() });
  console.log("初期データを入れました（スタッフ: admin@sakura-mart.example / password）");
}

main();
