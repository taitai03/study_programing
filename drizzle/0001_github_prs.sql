CREATE TABLE "course_repos" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"repo_full_name" text NOT NULL,
	"installation_id" integer NOT NULL,
	"is_private" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_repos_repo_full_name_unique" UNIQUE("repo_full_name")
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "repo_full_name" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "pr_number" integer;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "head_sha" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "course_repos" ADD CONSTRAINT "course_repos_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_repos_user_course_idx" ON "course_repos" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_pr_head_idx" ON "submissions" USING btree ("repo_full_name","pr_number","head_sha");