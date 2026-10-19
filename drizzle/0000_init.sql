CREATE TYPE "public"."progress_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('learner', 'mentor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."submission_kind" AS ENUM('browser', 'quiz', 'pull_request');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'passed', 'failed', 'invalid');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "allowed_users" (
	"github_login" text PRIMARY KEY NOT NULL,
	"role" "role" DEFAULT 'learner' NOT NULL,
	"invited_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"status" "progress_status" DEFAULT 'in_progress' NOT NULL,
	"exercise_passed_at" timestamp,
	"quiz_passed_at" timestamp,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "progress_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"kind" "submission_kind" NOT NULL,
	"status" "submission_status" NOT NULL,
	"summary" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"github_login" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_github_login_unique" UNIQUE("github_login")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "submissions_user_lesson_idx" ON "submissions" USING btree ("user_id","lesson_id");