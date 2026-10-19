import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Better Auth が使うテーブル（user / session / account / verification）
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  githubLogin: text("github_login").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// アプリのテーブル
// ---------------------------------------------------------------------------

export const roleEnum = pgEnum("role", ["learner", "mentor", "admin"]);

/** ログインを許可するGitHubユーザー。権限（ロール）もここで管理する */
export const allowedUsers = pgTable("allowed_users", {
  githubLogin: text("github_login").primaryKey(),
  role: roleEnum("role").notNull().default("learner"),
  invitedBy: text("invited_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const progressStatusEnum = pgEnum("progress_status", [
  "in_progress",
  "completed",
]);

/** レッスンごとの進捗。lesson_id は content/ のパス（例: typescript/beginner/01-read-errors） */
export const progress = pgTable(
  "progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    status: progressStatusEnum("status").notNull().default("in_progress"),
    exercisePassedAt: timestamp("exercise_passed_at"),
    quizPassedAt: timestamp("quiz_passed_at"),
    completedAt: timestamp("completed_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

export const submissionKindEnum = pgEnum("submission_kind", [
  "browser",
  "quiz",
  "pull_request",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "passed",
  "failed",
  "invalid",
]);

/** 提出と判定結果の履歴 */
export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    kind: submissionKindEnum("kind").notNull(),
    status: submissionStatusEnum("status").notNull(),
    summary: jsonb("summary"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("submissions_user_lesson_idx").on(t.userId, t.lessonId)],
);
