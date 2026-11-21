CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"agent_session_id" text,
	"title" text DEFAULT 'New chat' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone,
	"archived" boolean DEFAULT false NOT NULL,
	"share_token" text
);
--> statement-breakpoint
CREATE TABLE "review_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"execution_id" text NOT NULL,
	"session_id" text,
	"action" text NOT NULL,
	"decision_payload" jsonb,
	"reason" text,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "sessions_owner_updated_idx" ON "chat_sessions" USING btree ("owner_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_share_token_unique" ON "chat_sessions" USING btree ("share_token");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_agent_session_unique" ON "chat_sessions" USING btree ("agent_session_id");--> statement-breakpoint
CREATE INDEX "review_audit_owner_created_idx" ON "review_audit" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "review_audit_execution_idx" ON "review_audit" USING btree ("execution_id");