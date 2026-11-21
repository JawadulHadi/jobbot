import { pgTable, text, timestamp, uuid, boolean, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id").notNull(),
    agentSessionId: text("agent_session_id"),
    title: text("title").notNull().default("New chat"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    archived: boolean("archived").notNull().default(false),
    shareToken: text("share_token"),
  },
  (t) => ({
    ownerUpdatedIdx: index("sessions_owner_updated_idx").on(t.ownerId, t.updatedAt),
    shareTokenUnique: uniqueIndex("sessions_share_token_unique").on(t.shareToken),
    agentSessionUnique: uniqueIndex("sessions_agent_session_unique").on(t.agentSessionId),
  })
);

export const reviewAudit = pgTable(
  "review_audit",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id").notNull(),
    executionId: text("execution_id").notNull(),
    sessionId: text("session_id"),
    action: text("action").notNull(),
    decisionPayload: jsonb("decision_payload"),
    reason: text("reason"),
    status: text("status").notNull().default("submitted"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    ownerCreatedIdx: index("review_audit_owner_created_idx").on(t.ownerId, t.createdAt),
    executionIdx: index("review_audit_execution_idx").on(t.executionId),
  })
);

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ReviewAuditEntry = typeof reviewAudit.$inferSelect;
export type NewReviewAuditEntry = typeof reviewAudit.$inferInsert;