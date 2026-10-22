CREATE TABLE "conversations" (
	"thread_id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"title" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"messages" jsonb NOT NULL,
	"message_ids" jsonb NOT NULL,
	"revision" integer NOT NULL
);
