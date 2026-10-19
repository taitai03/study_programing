import { eq } from "drizzle-orm";
import type { Db } from ".";
import { createOrder } from "@/lib/orders";
import { hashPassword } from "@/lib/password";
import { categories, coupons, type MemberRank, members, orders, products, staff } from "./schema";

/**
 * 開発用の初期データ（業務仕様 5章）。毎回同じ内容になるよう、乱数は種を固定する。
 * 商品50件、会員200人、注文2,000件（過去6か月分）、クーポン5件、スタッフ3人
 */

/** 種を固定した疑似乱数（mulberry32） */
export function createRandom(seed: number) {
  let a = seed;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]) => items[Math.floor(next() * items.length)],
  };
}

export const CATEGORY_NAMES = ["食品", "飲料", "日用品", "キッチン用品", "文具", "ギフト"] as const;

const PRODUCT_NAMES: Record<(typeof CATEGORY_NAMES)[number], [string, number][]> = {
  食品: [
    ["国産こしひかり 5kg", 2980],
    ["北海道産 じゃがいも 3kg", 1280],
    ["さば味噌煮 缶詰 3缶セット", 780],
    ["十勝あずき 300g", 640],
    ["手延べそうめん 900g", 1180],
    ["有機 玄米フレーク", 520],
    ["焼きのり 全形10枚", 680],
    ["国産はちみつ 500g", 1980],
    ["だしパック 30袋", 1480],
  ],
  飲料: [
    ["天然水 2L × 6本", 980],
    ["静岡煎茶 100g", 1080],
    ["ドリップコーヒー 20袋", 1280],
    ["国産りんごジュース 1L", 480],
    ["炭酸水 500ml × 24本", 1680],
    ["ほうじ茶 ティーバッグ 50袋", 720],
    ["麦茶 ティーバッグ 54袋", 380],
    ["甘酒 6本セット", 1500],
  ],
  日用品: [
    ["ボックスティッシュ 5箱", 398],
    ["トイレットペーパー 12ロール", 598],
    ["洗濯洗剤 詰め替え 1.5kg", 698],
    ["食器用洗剤 詰め替え", 298],
    ["ハンドソープ 泡 本体", 348],
    ["ごみ袋 45L 50枚", 428],
    ["マスク 50枚", 698],
    ["ウェットティッシュ 3個パック", 358],
    ["歯ブラシ 4本セット", 398],
  ],
  キッチン用品: [
    ["ステンレス 片手鍋 18cm", 3480],
    ["木製まな板", 2280],
    ["三徳包丁 165mm", 4980],
    ["耐熱ガラス 保存容器 3点", 1980],
    ["シリコン 菜箸", 680],
    ["計量カップ 500ml", 580],
    ["鉄製 フライパン 26cm", 5800],
    ["キッチンタイマー", 980],
  ],
  文具: [
    ["ノート A5 5冊", 480],
    ["ゲルインクボールペン 10本", 980],
    ["付箋 カラー 10冊", 580],
    ["クリアファイル A4 20枚", 380],
    ["ホッチキス", 680],
    ["修正テープ 3個", 520],
    ["方眼メモパッド", 280],
    ["万年筆 入門用", 2200],
  ],
  ギフト: [
    ["季節のフルーツ詰め合わせ", 5400],
    ["お菓子の詰め合わせ", 3240],
    ["今治タオル ギフトセット", 4320],
    ["日本茶 飲み比べセット", 3780],
    ["高級海苔 詰め合わせ", 5940],
    ["ジャム 3本セット", 2700],
    ["カタログギフト 5,000円コース", 5500],
    ["米 食べ比べ 3種", 3300],
  ],
};

const FAMILY_NAMES = ["佐藤", "鈴木", "高橋", "田中", "伊藤", "渡辺", "山本", "中村", "小林", "加藤", "吉田", "山田", "佐々木", "山口", "松本"];
const GIVEN_NAMES = ["陽翔", "結衣", "蓮", "陽葵", "湊", "凛", "大和", "芽依", "悠真", "さくら", "蒼", "美咲", "樹", "葵", "颯太"];

const DAY_MS = 24 * 60 * 60 * 1000;

export type SeedOptions = { members: number; orders: number; now: Date };

export function seed(db: Db, { members: memberCount, orders: orderCount, now }: SeedOptions) {
  const random = createRandom(20260401);

  db.insert(categories)
    .values(CATEGORY_NAMES.map((name) => ({ name })))
    .run();
  const categoryRows = db.select().from(categories).all();

  const productValues = categoryRows.flatMap((c) =>
    PRODUCT_NAMES[c.name as (typeof CATEGORY_NAMES)[number]].map(([name, price]) => ({
      name,
      price,
      description: `${c.name}の定番商品です。`,
      categoryId: c.id,
      createdAt: new Date(now.getTime() - 200 * DAY_MS),
      updatedAt: new Date(now.getTime() - 200 * DAY_MS),
    })),
  );
  // 一部の商品は非公開にしておく（販売終了など）
  productValues.forEach((p, i) => Object.assign(p, { isPublished: i % 17 !== 16 }));
  db.insert(products).values(productValues).run();
  const productRows = db.select().from(products).all();

  const ranks: MemberRank[] = ["regular", "regular", "regular", "silver", "silver", "gold"];
  db.insert(members)
    .values(
      Array.from({ length: memberCount }, (_, i) => {
        const n = String(i + 1).padStart(4, "0");
        return {
          name: `${random.pick(FAMILY_NAMES)} ${random.pick(GIVEN_NAMES)}`,
          email: `member${n}@example.com`,
          rank: random.pick(ranks),
          apiToken: `member-${n}-token`,
          createdAt: new Date(now.getTime() - random.int(200, 400) * DAY_MS),
        };
      }),
    )
    .run();

  db.insert(coupons)
    .values([
      { code: "WELCOME500", discountType: "fixed", discountValue: 500, minAmount: 3000, startsAt: new Date(now.getTime() - 365 * DAY_MS), endsAt: new Date(now.getTime() + 365 * DAY_MS) },
      { code: "SPRING10", discountType: "percent", discountValue: 10, minAmount: 0, startsAt: new Date(now.getTime() - 180 * DAY_MS), endsAt: new Date(now.getTime() + 30 * DAY_MS) },
      { code: "GIFT1000", discountType: "fixed", discountValue: 1000, minAmount: 8000, startsAt: new Date(now.getTime() - 180 * DAY_MS), endsAt: new Date(now.getTime() + 90 * DAY_MS) },
      { code: "SUMMER15", discountType: "percent", discountValue: 15, minAmount: 5000, startsAt: new Date(now.getTime() - 400 * DAY_MS), endsAt: new Date(now.getTime() - 300 * DAY_MS) },
      { code: "THANKS300", discountType: "fixed", discountValue: 300, minAmount: 1000, startsAt: new Date(now.getTime() - 180 * DAY_MS), endsAt: new Date(now.getTime() + 180 * DAY_MS) },
    ])
    .run();

  const password = hashPassword("password");
  db.insert(staff)
    .values([
      { name: "管理者 さくら", email: "admin@sakura-mart.example", passwordHash: password, role: "admin" },
      { name: "店舗 たろう", email: "staff1@sakura-mart.example", passwordHash: password, role: "staff" },
      { name: "店舗 はなこ", email: "staff2@sakura-mart.example", passwordHash: password, role: "staff" },
    ])
    .run();

  // 注文は古い順に作る。古い注文ほど、発送・完了まで進んでいる
  const published = productRows.filter((p) => p.isPublished);
  const couponCodes = ["WELCOME500", "SPRING10", "GIFT1000", "THANKS300"];
  for (let i = 0; i < orderCount; i++) {
    const daysAgo = 180 * (1 - i / orderCount);
    const createdAt = new Date(now.getTime() - daysAgo * DAY_MS - random.int(0, 86_399) * 1000);
    const items = Array.from({ length: random.int(1, 4) }, () => ({
      productId: random.pick(published).id,
      quantity: random.int(1, 3),
    }));
    const merged = [...new Map(items.map((it) => [it.productId, it])).values()];
    const couponCode = random.next() < 0.1 ? random.pick(couponCodes) : undefined;
    let order;
    try {
      order = createOrder(db, { memberId: random.int(1, memberCount), items: merged, couponCode, now: createdAt });
    } catch {
      // クーポンの条件を満たさない注文は、クーポンなしで作る
      order = createOrder(db, { memberId: random.int(1, memberCount), items: merged, now: createdAt });
    }
    const roll = random.next();
    const status =
      roll < 0.05
        ? "cancelled"
        : daysAgo > 14
          ? "completed"
          : daysAgo > 5
            ? "shipped"
            : daysAgo > 1
              ? "paid"
              : "pending";
    db.update(orders).set({ status }).where(eq(orders.id, order.id)).run();
  }
}
