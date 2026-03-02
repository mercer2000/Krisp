import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  date,
  pgEnum,
  serial,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const priorityEnum = pgEnum("priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

// ── Users ──────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  boards: many(boards),
}));

// ── Boards ─────────────────────────────────────────────
export const boards = pgTable("boards", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  backgroundColor: varchar("background_color", { length: 7 })
    .default("#F0F4F8")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const boardsRelations = relations(boards, ({ one, many }) => ({
  user: one(users, { fields: [boards.userId], references: [users.id] }),
  columns: many(columns),
}));

// ── Columns ────────────────────────────────────────────
export const columns = pgTable("columns", {
  id: uuid("id").defaultRandom().primaryKey(),
  boardId: uuid("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  position: integer("position").notNull(),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const columnsRelations = relations(columns, ({ one, many }) => ({
  board: one(boards, { fields: [columns.boardId], references: [boards.id] }),
  cards: many(cards),
}));

// ── Cards ──────────────────────────────────────────────
export const cards = pgTable("cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  columnId: uuid("column_id")
    .notNull()
    .references(() => columns.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  position: integer("position").notNull(),
  dueDate: date("due_date"),
  priority: priorityEnum("priority").default("medium").notNull(),
  colorLabel: varchar("color_label", { length: 7 }),
  archived: boolean("archived").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const cardsRelations = relations(cards, ({ one, many }) => ({
  column: one(columns, { fields: [cards.columnId], references: [columns.id] }),
  tags: many(cardTags),
}));

// ── Card Tags ──────────────────────────────────────────
export const cardTags = pgTable("card_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  cardId: uuid("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
});

export const cardTagsRelations = relations(cardTags, ({ one }) => ({
  card: one(cards, { fields: [cardTags.cardId], references: [cards.id] }),
}));

// ── Action Items ──────────────────────────────────────
export const actionItemStatusEnum = pgEnum("action_item_status", [
  "open",
  "in_progress",
  "completed",
  "cancelled",
]);

export const actionItems = pgTable("action_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  meetingId: integer("meeting_id").references(() => webhookKeyPoints.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  assignee: varchar("assignee", { length: 255 }),
  status: actionItemStatusEnum("status").default("open").notNull(),
  priority: priorityEnum("priority").default("medium").notNull(),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Webhook Key Points (Krisp Meetings) ───────────────
export const webhookKeyPoints = pgTable("webhook_key_points", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  webhookId: varchar("webhook_id", { length: 255 }).notNull().unique(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  meetingId: varchar("meeting_id", { length: 255 }).notNull(),
  meetingTitle: text("meeting_title"),
  meetingUrl: text("meeting_url"),
  meetingStartDate: timestamp("meeting_start_date", { withTimezone: true }),
  meetingEndDate: timestamp("meeting_end_date", { withTimezone: true }),
  meetingDuration: integer("meeting_duration"),
  speakers: jsonb("speakers").default([]),
  participants: jsonb("participants").default([]),
  calendarEventId: varchar("calendar_event_id", { length: 255 }),
  content: jsonb("content").notNull().default([]),
  rawMeeting: text("raw_meeting"),
  rawContent: text("raw_content"),
  fullPayload: jsonb("full_payload").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Password Reset Tokens ─────────────────────────────
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Gmail Emails ─────────────────────────────────────
export const gmailEmails = pgTable(
  "gmail_emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gmailMessageId: text("gmail_message_id").notNull(),
    threadId: text("thread_id"),
    sender: text("sender").notNull(),
    recipients: jsonb("recipients").notNull().default([]),
    subject: text("subject"),
    bodyPlain: text("body_plain"),
    bodyHtml: text("body_html"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    attachments: jsonb("attachments").notNull().default([]),
    labels: jsonb("labels").notNull().default([]),
    rawPayload: jsonb("raw_payload"),
    ingestedAt: timestamp("ingested_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_tenant_gmail_message").on(
      table.tenantId,
      table.gmailMessageId
    ),
    index("idx_gmail_emails_tenant_id").on(table.tenantId),
    index("idx_gmail_emails_received_at").on(table.tenantId, table.receivedAt),
    index("idx_gmail_emails_sender").on(table.tenantId, table.sender),
  ]
);

// ── Gmail Watch Subscriptions ────────────────────────
export const gmailWatchSubscriptions = pgTable(
  "gmail_watch_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emailAddress: varchar("email_address", { length: 320 }).notNull(),
    historyId: varchar("history_id", { length: 100 }),
    expiration: timestamp("expiration", { withTimezone: true }),
    topicName: varchar("topic_name", { length: 512 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiry: timestamp("token_expiry", { withTimezone: true }),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_gmail_watch_tenant_email").on(
      table.tenantId,
      table.emailAddress
    ),
    index("idx_gmail_watch_tenant").on(table.tenantId),
    index("idx_gmail_watch_expiration").on(table.expiration),
  ]
);

// ── Webhook Secrets ──────────────────────────────────
export const webhookSecrets = pgTable("webhook_secrets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull().default("Krisp"),
  secret: varchar("secret", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  uniqueIndex("uq_webhook_secrets_user_name").on(table.userId, table.name),
]);

// ── Graph Credentials (Azure AD App Registration) ────
export const graphCredentials = pgTable(
  "graph_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    azureTenantId: varchar("azure_tenant_id", { length: 255 }).notNull(),
    clientId: varchar("client_id", { length: 255 }).notNull(),
    clientSecret: text("client_secret").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_graph_credentials_tenant").on(table.tenantId),
  ]
);

// ── Graph Subscriptions (Microsoft Graph API) ────────
export const graphSubscriptions = pgTable(
  "graph_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subscriptionId: varchar("subscription_id", { length: 512 }).notNull(),
    resource: varchar("resource", { length: 512 }).notNull(),
    changeType: varchar("change_type", { length: 100 }).notNull(),
    clientState: varchar("client_state", { length: 255 }).notNull(),
    expirationDateTime: timestamp("expiration_date_time", {
      withTimezone: true,
    }).notNull(),
    notificationUrl: text("notification_url").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_graph_subscription_id").on(table.subscriptionId),
    index("idx_graph_subscriptions_tenant").on(table.tenantId),
    index("idx_graph_subscriptions_expiration").on(table.expirationDateTime),
  ]
);

// ── Emails (Microsoft 365 Exchange) ──────────────────
export const emails = pgTable(
  "emails",
  {
    id: serial("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    messageId: varchar("message_id", { length: 512 }).notNull(),
    sender: varchar("sender", { length: 512 }).notNull(),
    recipients: jsonb("recipients").notNull().default([]),
    cc: jsonb("cc").notNull().default([]),
    bcc: jsonb("bcc").notNull().default([]),
    subject: text("subject"),
    bodyPlainText: text("body_plain_text"),
    bodyHtml: text("body_html"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    attachmentsMetadata: jsonb("attachments_metadata").notNull().default([]),
    rawPayload: jsonb("raw_payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_emails_tenant_message").on(
      table.tenantId,
      table.messageId
    ),
    index("idx_emails_tenant_id").on(table.tenantId),
    index("idx_emails_received_at").on(table.receivedAt),
    index("idx_emails_tenant_received").on(table.tenantId, table.receivedAt),
  ]
);
