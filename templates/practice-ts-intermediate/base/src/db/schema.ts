import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// 金額はすべて円（整数）で持つ。日時は UTC のミリ秒

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  /** 税抜の価格 */
  price: integer("price").notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const MEMBER_RANKS = ["regular", "silver", "gold"] as const;
export type MemberRank = (typeof MEMBER_RANKS)[number];

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  rank: text("rank", { enum: MEMBER_RANKS }).notNull().default("regular"),
  points: integer("points").notNull().default(0),
  /** 会員向けAPIの認証に使うトークン（Authorization: Bearer <token>） */
  apiToken: text("api_token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const DISCOUNT_TYPES = ["fixed", "percent"] as const;

export const coupons = sqliteTable("coupons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  /** fixed: 定額（円）、percent: 定率（%） */
  discountType: text("discount_type", { enum: DISCOUNT_TYPES }).notNull(),
  discountValue: integer("discount_value").notNull(),
  /** ランク割引のあとの金額で判定する */
  minAmount: integer("min_amount").notNull().default(0),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
});

export const ORDER_STATUSES = ["pending", "paid", "shipped", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id")
    .notNull()
    .references(() => members.id),
  status: text("status", { enum: ORDER_STATUSES }).notNull().default("pending"),
  /** 小計（税抜） */
  subtotal: integer("subtotal").notNull(),
  rankDiscount: integer("rank_discount").notNull(),
  couponDiscount: integer("coupon_discount").notNull(),
  tax: integer("tax").notNull(),
  shippingFee: integer("shipping_fee").notNull(),
  total: integer("total").notNull(),
  pointsEarned: integer("points_earned").notNull(),
  couponId: integer("coupon_id").references(() => coupons.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  /** 注文した時点の価格（税抜）。あとで商品の価格が変わっても、注文の金額は変わらない */
  unitPrice: integer("unit_price").notNull(),
});

export const STAFF_ROLES = ["admin", "staff"] as const;

export const staff = sqliteTable("staff", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: STAFF_ROLES }).notNull().default("staff"),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));

export const membersRelations = relations(members, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  member: one(members, { fields: [orders.memberId], references: [members.id] }),
  coupon: one(coupons, { fields: [orders.couponId], references: [coupons.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export type Product = typeof products.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Staff = typeof staff.$inferSelect;
