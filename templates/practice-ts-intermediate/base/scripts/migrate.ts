// DBにマイグレーションを当てる。実行: npm run db:migrate
import { db, migrateDb } from "@/db";

migrateDb(db);
console.log("マイグレーションを当てました");
