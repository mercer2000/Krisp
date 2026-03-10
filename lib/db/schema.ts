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
  customType,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { type AnyPgColumn } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import {
  crudPolicy,
  authenticatedRole,
} from "drizzle-orm/neon";

// Custom authUid that casts auth.user_id() to uuid (the default returns text)
const authUid = (userIdColumn: AnyPgColumn): SQL =>
  sql`(select auth.user_id()::uuid = ${userIdColumn})`;

// pgvector type for embedding columns (vector(1536) for OpenAI text-embedding-3-small)
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  fromDriver(value: string): number[] {
    return value
      .slice(1, -1)
      .split(",")
      .map(Number);
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
});

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
  defaultBoardId: uuid("default_board_id"),
  emailActionBoardId: uuid("email_action_board_id"),
  dashboardConfig: jsonb("dashboard_config"),
  openrouterApiKey: text("openrouter_api_key"),
  openrouterKeyHash: varchar("openrouter_key_hash", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: authUid(table.id),
    modify: authUid(table.id),
  }),
]);

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
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: authUid(table.userId),
    modify: authUid(table.userId),
  }),
]);

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
}, (table) => [
  pgPolicy("columns_auth_select", {
    for: "select",
    to: authenticatedRole,
    using: sql`board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid))`,
  }),
  pgPolicy("columns_auth_insert", {
    for: "insert",
    to: authenticatedRole,
    withCheck: sql`board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid))`,
  }),
  pgPolicy("columns_auth_update", {
    for: "update",
    to: authenticatedRole,
    using: sql`board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid))`,
    withCheck: sql`board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid))`,
  }),
  pgPolicy("columns_auth_delete", {
    for: "delete",
    to: authenticatedRole,
    using: sql`board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid))`,
  }),
]);

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
  checklist: jsonb("checklist").$type<{ id: string; title: string; done: boolean }[]>(),
  archived: boolean("archived").default(false).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  pgPolicy("cards_auth_select", {
    for: "select",
    to: authenticatedRole,
    using: sql`column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid))`,
  }),
  pgPolicy("cards_auth_insert", {
    for: "insert",
    to: authenticatedRole,
    withCheck: sql`column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid))`,
  }),
  pgPolicy("cards_auth_update", {
    for: "update",
    to: authenticatedRole,
    using: sql`column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid))`,
    withCheck: sql`column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid))`,
  }),
  pgPolicy("cards_auth_delete", {
    for: "delete",
    to: authenticatedRole,
    using: sql`column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid))`,
  }),
]);

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
}, (table) => [
  pgPolicy("card_tags_auth_select", {
    for: "select",
    to: authenticatedRole,
    using: sql`card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid))`,
  }),
  pgPolicy("card_tags_auth_insert", {
    for: "insert",
    to: authenticatedRole,
    withCheck: sql`card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid))`,
  }),
  pgPolicy("card_tags_auth_update", {
    for: "update",
    to: authenticatedRole,
    using: sql`card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid))`,
    withCheck: sql`card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid))`,
  }),
  pgPolicy("card_tags_auth_delete", {
    for: "delete",
    to: authenticatedRole,
    using: sql`card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid))`,
  }),
]);

export const cardTagsRelations = relations(cardTags, ({ one }) => ({
  card: one(cards, { fields: [cardTags.cardId], references: [cards.id] }),
}));

// ── Decisions ─────────────────────────────────────────
export const decisionStatusEnum = pgEnum("decision_status", [
  "active",
  "reconsidered",
  "archived",
]);

export const decisionCategoryEnum = pgEnum("decision_category", [
  "technical",
  "process",
  "budget",
  "strategic",
  "other",
]);

export const decisions = pgTable(
  "decisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    meetingId: integer("meeting_id").references(() => webhookKeyPoints.id, {
      onDelete: "set null",
    }),
    emailId: integer("email_id"),
    statement: text("statement").notNull(),
    context: text("context"),
    rationale: text("rationale"),
    participants: jsonb("participants").default([]),
    category: decisionCategoryEnum("category").default("other").notNull(),
    status: decisionStatusEnum("status").default("active").notNull(),
    priority: priorityEnum("priority").default("medium").notNull(),
    extractionSource: varchar("extraction_source", { length: 50 })
      .default("manual")
      .notNull(),
    confidence: integer("confidence").default(100),
    annotation: text("annotation"),
    decisionDate: timestamp("decision_date", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_decisions_user_id").on(table.userId),
    index("idx_decisions_meeting_id").on(table.meetingId),
    index("idx_decisions_status").on(table.userId, table.status),
    index("idx_decisions_category").on(table.userId, table.category),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

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
  cardId: uuid("card_id").references(() => cards.id, { onDelete: "set null" }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  assignee: varchar("assignee", { length: 255 }),
  extractionSource: varchar("extraction_source", { length: 50 })
    .default("manual")
    .notNull(),
  status: actionItemStatusEnum("status").default("open").notNull(),
  priority: priorityEnum("priority").default("medium").notNull(),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: authUid(table.userId),
    modify: authUid(table.userId),
  }),
]);

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
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: authUid(table.userId),
    modify: authUid(table.userId),
  }),
]);

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
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: authUid(table.userId),
    modify: authUid(table.userId),
  }),
]);

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
    isNewsletter: boolean("is_newsletter").default(false).notNull(),
    isSpam: boolean("is_spam").default(false).notNull(),
    unsubscribeLink: text("unsubscribe_link"),
    isRead: boolean("is_read").default(false).notNull(),
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
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
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
    emailActionBoardId: uuid("email_action_board_id"), // per-account Kanban board for auto-ticket creation
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
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
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
  crudPolicy({
    role: authenticatedRole,
    read: authUid(table.userId),
    modify: authUid(table.userId),
  }),
]);

// ── Graph Credentials (Azure AD App Registration) ────
export const graphCredentials = pgTable(
  "graph_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 255 }).notNull().default("Default"),
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
    index("idx_graph_credentials_tenant").on(table.tenantId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
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
    credentialId: uuid("credential_id").references(() => graphCredentials.id, {
      onDelete: "set null",
    }),
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
    index("idx_graph_subscriptions_credential").on(table.credentialId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
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
    webLink: text("web_link"),
    rawPayload: jsonb("raw_payload").notNull(),
    embedding: vector("embedding"),
    embeddingGeneratedAt: timestamp("embedding_generated_at", { withTimezone: true }),
    outlookAccountId: uuid("outlook_account_id").references(
      () => outlookOauthTokens.id,
      { onDelete: "set null" }
    ),
    isNewsletter: boolean("is_newsletter").default(false).notNull(),
    isSpam: boolean("is_spam").default(false).notNull(),
    unsubscribeLink: text("unsubscribe_link"),
    isRead: boolean("is_read").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
    index("idx_emails_outlook_account").on(table.outlookAccountId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

// ── Email Labels (Smart Labels) ──────────────────────
export const emailLabels = pgTable(
  "email_labels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    color: varchar("color", { length: 7 }).notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_email_labels_tenant_name").on(table.tenantId, table.name),
    index("idx_email_labels_tenant").on(table.tenantId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

export const emailLabelAssignments = pgTable(
  "email_label_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    emailId: integer("email_id")
      .notNull()
      .references(() => emails.id, { onDelete: "cascade" }),
    labelId: uuid("label_id")
      .notNull()
      .references(() => emailLabels.id, { onDelete: "cascade" }),
    confidence: integer("confidence"),
    assignedBy: varchar("assigned_by", { length: 20 })
      .default("ai")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_email_label_assignment").on(table.emailId, table.labelId),
    index("idx_email_label_assignments_email").on(table.emailId),
    index("idx_email_label_assignments_label").on(table.labelId),
    pgPolicy("email_label_assignments_auth_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("email_label_assignments_auth_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("email_label_assignments_auth_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid))`,
      withCheck: sql`email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("email_label_assignments_auth_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid))`,
    }),
  ]
);

// ── Calendar Events (Microsoft 365) ──────────────────
export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialId: uuid("credential_id").references(() => graphCredentials.id, {
      onDelete: "set null",
    }),
    graphEventId: varchar("graph_event_id", { length: 512 }).notNull(),
    subject: text("subject"),
    bodyPreview: text("body_preview"),
    bodyHtml: text("body_html"),
    startDateTime: timestamp("start_date_time", { withTimezone: true }).notNull(),
    endDateTime: timestamp("end_date_time", { withTimezone: true }).notNull(),
    isAllDay: boolean("is_all_day").default(false).notNull(),
    location: text("location"),
    organizerEmail: varchar("organizer_email", { length: 512 }),
    organizerName: varchar("organizer_name", { length: 255 }),
    attendees: jsonb("attendees").notNull().default([]),
    webLink: text("web_link"),
    isCancelled: boolean("is_cancelled").default(false).notNull(),
    showAs: varchar("show_as", { length: 50 }),
    importance: varchar("importance", { length: 50 }),
    isRecurring: boolean("is_recurring").default(false).notNull(),
    seriesMasterId: varchar("series_master_id", { length: 512 }),
    rawPayload: jsonb("raw_payload"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_calendar_tenant_event").on(
      table.tenantId,
      table.graphEventId
    ),
    index("idx_calendar_events_tenant").on(table.tenantId),
    index("idx_calendar_events_start").on(table.tenantId, table.startDateTime),
    index("idx_calendar_events_end").on(table.tenantId, table.endDateTime),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

// ── Calendar Sync State ──────────────────────────────
export const calendarSyncState = pgTable(
  "calendar_sync_state",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialId: uuid("credential_id")
      .notNull()
      .references(() => graphCredentials.id, { onDelete: "cascade" }),
    mailbox: varchar("mailbox", { length: 320 }).notNull(),
    deltaLink: text("delta_link"),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_calendar_sync_tenant_cred_mailbox").on(
      table.tenantId,
      table.credentialId,
      table.mailbox
    ),
    index("idx_calendar_sync_tenant").on(table.tenantId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

// ── Outlook OAuth Tokens (Personal Microsoft Accounts) ──
export const outlookOauthTokens = pgTable(
  "outlook_oauth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    outlookEmail: varchar("outlook_email", { length: 320 }).notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    tokenExpiry: timestamp("token_expiry", { withTimezone: true }).notNull(),
    active: boolean("active").default(true).notNull(),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    emailActionBoardId: uuid("email_action_board_id"), // per-account Kanban board for auto-ticket creation
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_outlook_oauth_tenant_email").on(
      table.tenantId,
      table.outlookEmail
    ),
    index("idx_outlook_oauth_tenant").on(table.tenantId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

// ── Zoom OAuth Tokens ──────────────────────────────
export const zoomOauthTokens = pgTable(
  "zoom_oauth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    zoomAccountId: varchar("zoom_account_id", { length: 255 }),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    tokenExpiry: timestamp("token_expiry", { withTimezone: true }).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_zoom_oauth_tenant").on(table.tenantId),
    index("idx_zoom_oauth_tenant").on(table.tenantId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

// ── Zoom User OAuth Tokens (multi-account, user-managed) ──
export const zoomUserOauthTokens = pgTable(
  "zoom_user_oauth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    zoomEmail: varchar("zoom_email", { length: 255 }).notNull(),
    zoomUserId: varchar("zoom_user_id", { length: 255 }),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    tokenExpiry: timestamp("token_expiry", { withTimezone: true }).notNull(),
    active: boolean("active").default(true).notNull(),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    syncCursor: text("sync_cursor"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_zoom_user_oauth_tenant_email").on(table.tenantId, table.zoomEmail),
    index("idx_zoom_user_oauth_tenant").on(table.tenantId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

// ── Zoom Chat Messages ─────────────────────────────
export const zoomChannelTypeEnum = pgEnum("zoom_channel_type", [
  "dm",
  "channel",
]);

export const zoomChatMessages = pgTable(
  "zoom_chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    zoomUserId: varchar("zoom_user_id", { length: 255 }).notNull(),
    messageId: varchar("message_id", { length: 512 }).notNull(),
    channelId: varchar("channel_id", { length: 512 }),
    channelType: zoomChannelTypeEnum("channel_type").notNull(),
    senderId: varchar("sender_id", { length: 255 }).notNull(),
    senderName: varchar("sender_name", { length: 500 }),
    messageContent: text("message_content"),
    messageTimestamp: timestamp("message_timestamp", {
      withTimezone: true,
    }).notNull(),
    isEdited: boolean("is_edited").default(false).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    zoomAccountId: uuid("zoom_account_id").references(
      () => zoomUserOauthTokens.id
    ),
    rawPayload: jsonb("raw_payload"),
    embedding: vector("embedding"),
    embeddingGeneratedAt: timestamp("embedding_generated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_zoom_chat_tenant_message").on(
      table.tenantId,
      table.messageId
    ),
    index("idx_zoom_chat_tenant").on(table.tenantId),
    index("idx_zoom_chat_zoom_user").on(table.tenantId, table.zoomUserId),
    index("idx_zoom_chat_timestamp").on(
      table.tenantId,
      table.messageTimestamp
    ),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

// ── Brain Chat ──────────────────────────────────────
export const brainChatRoleEnum = pgEnum("brain_chat_role", [
  "user",
  "assistant",
]);

export const brainChatSessions = pgTable(
  "brain_chat_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).default("New Chat").notNull(),
    pendingAction: jsonb("pending_action"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_brain_chat_sessions_user").on(table.userId),
    index("idx_brain_chat_sessions_updated").on(table.userId, table.updatedAt),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

export const brainChatMessages = pgTable(
  "brain_chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => brainChatSessions.id, { onDelete: "cascade" }),
    role: brainChatRoleEnum("role").notNull(),
    content: text("content").notNull(),
    sourcesUsed: jsonb("sources_used").default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_brain_chat_messages_session").on(table.sessionId),
    index("idx_brain_chat_messages_created").on(
      table.sessionId,
      table.createdAt
    ),
    pgPolicy("brain_chat_messages_auth_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("brain_chat_messages_auth_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("brain_chat_messages_auth_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid))`,
      withCheck: sql`session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("brain_chat_messages_auth_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid))`,
    }),
  ]
);

// ── Weekly Reviews ──────────────────────────────────
export const weeklyReviewStatusEnum = pgEnum("weekly_review_status", [
  "generating",
  "completed",
  "failed",
]);

export const dailyBriefingStatusEnum = pgEnum("daily_briefing_status", [
  "generating",
  "completed",
  "failed",
]);

export const weeklyReviews = pgTable(
  "weekly_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekStart: date("week_start").notNull(),
    weekEnd: date("week_end").notNull(),
    status: weeklyReviewStatusEnum("status").default("generating").notNull(),
    topicClusters: jsonb("topic_clusters").notNull().default([]),
    unresolvedActionItems: jsonb("unresolved_action_items").notNull().default([]),
    crossDayPatterns: jsonb("cross_day_patterns").notNull().default([]),
    synthesisReport: text("synthesis_report"),
    meetingCount: integer("meeting_count").default(0).notNull(),
    emailCount: integer("email_count").default(0).notNull(),
    decisionCount: integer("decision_count").default(0).notNull(),
    actionItemCount: integer("action_item_count").default(0).notNull(),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_weekly_reviews_user_id").on(table.userId),
    index("idx_weekly_reviews_user_week").on(table.userId, table.weekStart),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

// ── Workspaces (Pages feature) ──────────────────────
export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  crudPolicy({
    role: authenticatedRole,
    read: authUid(table.ownerId),
    modify: authUid(table.ownerId),
  }),
]);

// ── Page types ──────────────────────────────────────
export const pageTypeEnum = pgEnum("page_type", [
  "page",       // standard Notion-style page
  "knowledge",  // knowledge collection page (auto-collects brain thoughts)
  "decisions",  // decisions collection page (auto-collects decisions)
]);

// ── Pages ───────────────────────────────────────────
export const pages = pgTable(
  "pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    title: varchar("title", { length: 500 }).default("").notNull(),
    icon: varchar("icon", { length: 50 }),
    coverUrl: text("cover_url"),
    isDatabase: boolean("is_database").default(false).notNull(),
    databaseConfig: jsonb("database_config"),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    // ── Smart-label-powered page fields ──
    pageType: pageTypeEnum("page_type").default("page").notNull(),
    color: varchar("color", { length: 7 }),             // hex color, e.g. "#3B82F6"
    smartRule: text("smart_rule"),                       // AI classification prompt (like smart label prompt)
    smartActive: boolean("smart_active").default(false).notNull(), // whether AI auto-adds entries
    smartRuleAccountId: uuid("smart_rule_account_id").references(
      () => outlookOauthTokens.id,
      { onDelete: "set null" }
    ), // which Outlook account to use for folder sync
    smartRuleFolderId: varchar("smart_rule_folder_id", { length: 255 }), // Graph API folder ID
    smartRuleFolderName: varchar("smart_rule_folder_name", { length: 255 }), // Outlook folder display name
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_pages_workspace_parent_sort").on(
      table.workspaceId,
      table.parentId,
      table.sortOrder
    ),
    index("idx_pages_workspace_archived").on(
      table.workspaceId,
      table.isArchived
    ),
    pgPolicy("pages_auth_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("pages_auth_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("pages_auth_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid))`,
      withCheck: sql`workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("pages_auth_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid))`,
    }),
  ]
);

// ── Blocks ──────────────────────────────────────────
export const blocks = pgTable(
  "blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    parentBlockId: uuid("parent_block_id"),
    type: varchar("type", { length: 50 }).notNull(),
    content: jsonb("content").notNull().default({}),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_blocks_page_parent_sort").on(
      table.pageId,
      table.parentBlockId,
      table.sortOrder
    ),
    pgPolicy("blocks_auth_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("blocks_auth_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("blocks_auth_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
      withCheck: sql`page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("blocks_auth_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
    }),
  ]
);

// ── Database Rows ───────────────────────────────────
export const databaseRows = pgTable(
  "database_rows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    databasePageId: uuid("database_page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    rowPageId: uuid("row_page_id").references(() => pages.id, {
      onDelete: "set null",
    }),
    properties: jsonb("properties").notNull().default({}),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_database_rows_page_sort").on(
      table.databasePageId,
      table.sortOrder
    ),
    pgPolicy("database_rows_auth_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("database_rows_auth_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("database_rows_auth_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
      withCheck: sql`database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("database_rows_auth_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
    }),
  ]
);

// ── Page Entries (knowledge, decisions, email summaries added to pages) ──
export const pageEntryTypeEnum = pgEnum("page_entry_type", [
  "knowledge",      // brain thought / knowledge entry
  "decision",       // decision record
  "email_summary",  // AI-generated email summary
  "manual",         // user-added note
]);

export const pageEntries = pgTable(
  "page_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    entryType: pageEntryTypeEnum("entry_type").notNull(),
    title: varchar("title", { length: 500 }).default("").notNull(),
    content: text("content").notNull().default(""),
    metadata: jsonb("metadata").default({}),  // source-specific data (thought_id, decision_id, email_id, etc.)
    sourceId: varchar("source_id", { length: 255 }),  // ID of the original item (brain thought, decision, email)
    sourceType: varchar("source_type", { length: 50 }),  // "brain_thought", "decision", "email", "gmail_email"
    confidence: integer("confidence"),  // AI confidence when auto-assigned (0-100)
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_page_entries_page_sort").on(table.pageId, table.sortOrder),
    index("idx_page_entries_source").on(table.sourceType, table.sourceId),
    // NULLs are distinct in PG unique indexes, so manual entries (null source) are not constrained
    uniqueIndex("uq_page_entry_source").on(table.pageId, table.sourceType, table.sourceId),
    pgPolicy("page_entries_auth_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("page_entries_auth_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("page_entries_auth_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
      withCheck: sql`page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("page_entries_auth_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))`,
    }),
  ]
);

// ── Telegram Bot Tokens ─────────────────────────────
export const telegramBotTokens = pgTable(
  "telegram_bot_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    botToken: text("bot_token").notNull(),
    botUsername: varchar("bot_username", { length: 255 }),
    chatId: varchar("chat_id", { length: 100 }),
    webhookSecret: varchar("webhook_secret", { length: 255 }).notNull(),
    activeSessionId: uuid("active_session_id"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_telegram_bot_user").on(table.userId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

// ── Outbound Webhooks ─────────────────────────────────
export const outboundWebhookEventEnum = pgEnum("outbound_webhook_event", [
  "card.created",
  "meeting.ingested",
  "email.received",
  "thought.captured",
]);

export const outboundWebhooks = pgTable(
  "outbound_webhooks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    url: text("url").notNull(),
    secret: varchar("secret", { length: 255 }),
    events: jsonb("events").notNull().default([]),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_outbound_webhooks_user").on(table.userId),
    index("idx_outbound_webhooks_active").on(table.userId, table.active),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

export const outboundWebhookDeliveries = pgTable(
  "outbound_webhook_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    webhookId: uuid("webhook_id")
      .notNull()
      .references(() => outboundWebhooks.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    payload: jsonb("payload").notNull(),
    statusCode: integer("status_code"),
    success: boolean("success").notNull(),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_outbound_webhook_deliveries_webhook").on(table.webhookId),
    index("idx_outbound_webhook_deliveries_sent").on(table.webhookId, table.sentAt),
    pgPolicy("outbound_webhook_deliveries_auth_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("outbound_webhook_deliveries_auth_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("outbound_webhook_deliveries_auth_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid))`,
      withCheck: sql`webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("outbound_webhook_deliveries_auth_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid))`,
    }),
  ]
);

// ── Brain Thoughts (Open Brain persistent memory) ────
export const brainThoughts = pgTable(
  "brain_thoughts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    source: varchar("source", { length: 100 }).notNull().default("manual"),
    author: varchar("author", { length: 255 }),
    topic: varchar("topic", { length: 255 }),
    sentiment: varchar("sentiment", { length: 50 }),
    urgency: varchar("urgency", { length: 50 }),
    tags: jsonb("tags").notNull().default([]),
    embedding: vector("embedding"),
    sourceUrl: text("source_url"),
    sourceDomain: varchar("source_domain", { length: 255 }),
    sourceTimestamp: timestamp("source_timestamp", { withTimezone: true }),
    truncated: boolean("truncated").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_brain_thoughts_user").on(table.userId),
    index("idx_brain_thoughts_user_created").on(table.userId, table.createdAt),
    index("idx_brain_thoughts_source").on(table.userId, table.source),
    index("idx_brain_thoughts_source_url").on(table.userId, table.sourceUrl),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

// ── Zapier Ingest Logs ──────────────────────────────
export const zapierIngestStatusEnum = pgEnum("zapier_ingest_status", [
  "success",
  "failed",
]);

export const zapierIngestLogs = pgTable(
  "zapier_ingest_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: varchar("source", { length: 255 }).notNull(),
    routingTarget: varchar("routing_target", { length: 20 }).notNull(),
    status: zapierIngestStatusEnum("status").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 255 }),
    errorMessage: text("error_message"),
    thoughtId: uuid("thought_id"),
    cardId: uuid("card_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_zapier_ingest_logs_user").on(table.userId),
    index("idx_zapier_ingest_logs_user_created").on(table.userId, table.createdAt),
    uniqueIndex("uq_zapier_ingest_idempotency").on(table.userId, table.idempotencyKey),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

// ── Custom AI Prompts ──────────────────────────────────
export const customPrompts = pgTable(
  "custom_prompts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    promptKey: varchar("prompt_key", { length: 100 }).notNull(),
    promptText: text("prompt_text").notNull(),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_custom_prompts_user_key").on(table.userId, table.promptKey),
    index("idx_custom_prompts_user").on(table.userId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

// ── Custom Prompt History ──────────────────────────────
export const customPromptHistory = pgTable(
  "custom_prompt_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    promptKey: varchar("prompt_key", { length: 100 }).notNull(),
    promptText: text("prompt_text").notNull(),
    version: integer("version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_custom_prompt_history_user_key").on(table.userId, table.promptKey),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

// ── Newsletter Sender Whitelist ───────────────────────
export const newsletterWhitelist = pgTable(
  "newsletter_whitelist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    senderEmail: varchar("sender_email", { length: 512 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_newsletter_whitelist_tenant_sender").on(
      table.tenantId,
      table.senderEmail
    ),
    index("idx_newsletter_whitelist_tenant").on(table.tenantId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

// ── Extension Downloads ───────────────────────────────
// ── Google OAuth Tokens (Google Calendar) ──
export const googleOauthTokens = pgTable(
  "google_oauth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    googleEmail: varchar("google_email", { length: 320 }).notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    tokenExpiry: timestamp("token_expiry", { withTimezone: true }).notNull(),
    active: boolean("active").default(true).notNull(),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_google_oauth_tenant_email").on(
      table.tenantId,
      table.googleEmail
    ),
    index("idx_google_oauth_tenant").on(table.tenantId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

export const extensionDownloads = pgTable(
  "extension_downloads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    version: varchar("version", { length: 20 }).notNull(),
    downloadedAt: timestamp("downloaded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_extension_downloads_user").on(table.userId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

// ── Smart Labels (AI-Powered Prompt-Driven Labels) ───────
export const smartLabels = pgTable(
  "smart_labels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    prompt: text("prompt").notNull(),
    color: varchar("color", { length: 7 }).notNull().default("#6366F1"),
    active: boolean("active").default(true).notNull(),
    autoDraftEnabled: boolean("auto_draft_enabled").default(false).notNull(),
    contextWindowMax: integer("context_window_max").default(7).notNull(),
    graphFolderId: varchar("graph_folder_id", { length: 255 }),
    folderSyncStatus: varchar("folder_sync_status", { length: 20 })
      .default("none")
      .notNull(), // "none" | "pending" | "synced" | "failed" | "unlinked"
    outlookAccountId: uuid("outlook_account_id").references(
      () => outlookOauthTokens.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_smart_labels_tenant_name").on(table.tenantId, table.name),
    index("idx_smart_labels_tenant").on(table.tenantId),
    index("idx_smart_labels_folder_sync").on(table.folderSyncStatus),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

export const smartLabelItems = pgTable(
  "smart_label_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    labelId: uuid("label_id")
      .notNull()
      .references(() => smartLabels.id, { onDelete: "cascade" }),
    itemType: varchar("item_type", { length: 30 }).notNull(), // "email", "card", "action_item", "meeting"
    itemId: varchar("item_id", { length: 255 }).notNull(), // string or numeric id cast to string
    confidence: integer("confidence"), // 0-100
    assignedBy: varchar("assigned_by", { length: 20 })
      .default("ai")
      .notNull(), // "ai" | "manual"
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_smart_label_item").on(
      table.labelId,
      table.itemType,
      table.itemId
    ),
    index("idx_smart_label_items_label").on(table.labelId),
    index("idx_smart_label_items_item").on(table.itemType, table.itemId),
    pgPolicy("smart_label_items_auth_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("smart_label_items_auth_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("smart_label_items_auth_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid))`,
      withCheck: sql`label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("smart_label_items_auth_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid))`,
    }),
  ]
);

// ── Smart Label Context Entries (per-label memory/context window) ──
export const smartLabelContextEntries = pgTable(
  "smart_label_context_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    labelId: uuid("label_id")
      .notNull()
      .references(() => smartLabels.id, { onDelete: "cascade" }),
    emailId: varchar("email_id", { length: 255 }).notNull(),
    emailType: varchar("email_type", { length: 30 }).notNull(), // "email" | "gmail_email"
    sender: text("sender").notNull(),
    subject: text("subject"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    bodyExcerpt: text("body_excerpt"), // truncated ~300 tokens
    userReplied: boolean("user_replied").default(false).notNull(),
    replyExcerpt: text("reply_excerpt"), // highest-signal field for tone calibration
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_slce_label").on(table.labelId),
    index("idx_slce_label_created").on(table.labelId, table.createdAt),
    pgPolicy("slce_auth_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("slce_auth_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("slce_auth_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid))`,
      withCheck: sql`label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid))`,
    }),
    pgPolicy("slce_auth_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid))`,
    }),
  ]
);

// ── Email Drafts (AI-generated reply drafts) ──────────
export const emailDraftStatusEnum = pgEnum("email_draft_status", [
  "pending_review",
  "sent",
  "discarded",
]);

export const emailDrafts = pgTable(
  "email_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emailId: varchar("email_id", { length: 255 }).notNull(),
    emailType: varchar("email_type", { length: 30 }).notNull(), // "email" | "gmail_email"
    labelId: uuid("label_id")
      .references(() => smartLabels.id, { onDelete: "set null" }),
    draftBody: text("draft_body").notNull(),
    status: emailDraftStatusEnum("status").default("pending_review").notNull(),
    discardedAt: timestamp("discarded_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_email_drafts_tenant").on(table.tenantId),
    index("idx_email_drafts_email").on(table.emailId, table.emailType),
    index("idx_email_drafts_status").on(table.tenantId, table.status),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

// ── Folder Move Queue (retry queue for Outlook folder moves) ──
export const folderMoveQueue = pgTable(
  "folder_move_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    labelId: uuid("label_id")
      .notNull()
      .references(() => smartLabels.id, { onDelete: "cascade" }),
    emailId: varchar("email_id", { length: 255 }).notNull(),
    graphMessageId: varchar("graph_message_id", { length: 512 }).notNull(),
    graphFolderId: varchar("graph_folder_id", { length: 255 }).notNull(),
    outlookAccountId: uuid("outlook_account_id")
      .notNull()
      .references(() => outlookOauthTokens.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).default("pending").notNull(), // "pending" | "success" | "failed" | "skipped"
    attempts: integer("attempts").default(0).notNull(),
    lastError: text("last_error"),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_fmq_tenant").on(table.tenantId),
    index("idx_fmq_status_retry").on(table.status, table.nextRetryAt),
    index("idx_fmq_label").on(table.labelId),
    uniqueIndex("uq_fmq_email_label").on(table.emailId, table.labelId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

// ── Daily Briefings ────────────────────────────────────
export const dailyBriefings = pgTable(
  "daily_briefings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    briefingDate: date("briefing_date").notNull(),
    status: dailyBriefingStatusEnum("status").default("generating").notNull(),
    briefingHtml: text("briefing_html"),
    overdueCardCount: integer("overdue_card_count").default(0).notNull(),
    emailCount: integer("email_count").default(0).notNull(),
    meetingCount: integer("meeting_count").default(0).notNull(),
    actionItemCount: integer("action_item_count").default(0).notNull(),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_daily_briefings_user_id").on(table.userId),
    index("idx_daily_briefings_user_date").on(table.userId, table.briefingDate),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

// ── VIP Contacts ─────────────────────────────────────
export const vipContacts = pgTable(
  "vip_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 512 }).notNull(),
    domain: varchar("domain", { length: 255 }),
    displayName: varchar("display_name", { length: 255 }),
    notifyOnNew: boolean("notify_on_new").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_vip_contacts_tenant_email").on(table.tenantId, table.email),
    index("idx_vip_contacts_tenant").on(table.tenantId),
    index("idx_vip_contacts_domain").on(table.tenantId, table.domain),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

// ── Thought Links (link brain thoughts to cards, meetings, emails) ──
export const thoughtLinks = pgTable(
  "thought_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    thoughtId: uuid("thought_id")
      .notNull()
      .references(() => brainThoughts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    linkedEntityType: varchar("linked_entity_type", { length: 30 }).notNull(), // "card" | "meeting" | "email"
    linkedEntityId: varchar("linked_entity_id", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_thought_link").on(
      table.thoughtId,
      table.linkedEntityType,
      table.linkedEntityId
    ),
    index("idx_thought_links_thought").on(table.thoughtId),
    index("idx_thought_links_user").on(table.userId),
    index("idx_thought_links_entity").on(table.linkedEntityType, table.linkedEntityId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

// ── Thought Reminders ────────────────────────────────
export const reminderModeEnum = pgEnum("reminder_mode", [
  "one_time",
  "spaced_repetition",
]);

export const reminderStatusEnum = pgEnum("reminder_status", [
  "pending",
  "sent",
  "cancelled",
]);

export const thoughtReminders = pgTable(
  "thought_reminders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    thoughtId: uuid("thought_id")
      .notNull()
      .references(() => brainThoughts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    mode: reminderModeEnum("mode").notNull().default("one_time"),
    status: reminderStatusEnum("status").notNull().default("pending"),
    repetitionNumber: integer("repetition_number").default(0).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_thought_reminders_user").on(table.userId),
    index("idx_thought_reminders_pending").on(table.status, table.scheduledAt),
    index("idx_thought_reminders_thought").on(table.thoughtId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

// ── Email Contacts ───────────────────────────────────
export const emailContacts = pgTable(
  "email_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    displayName: text("display_name"),
    emailCount: integer("email_count").default(0).notNull(),
    lastEmailAt: timestamp("last_email_at", { withTimezone: true }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_email_contacts_tenant_email").on(
      table.tenantId,
      table.email
    ),
    index("idx_email_contacts_tenant").on(table.tenantId),
    index("idx_email_contacts_email_count").on(table.tenantId, table.emailCount),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);

// ── Subscription Status Enum ─────────────────────────
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
]);

// ── Subscriptions ────────────────────────────────────
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 })
      .notNull()
      .unique(),
    stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),
    stripeCurrentPeriodEnd: timestamp("stripe_current_period_end", {
      withTimezone: true,
    }).notNull(),
    status: subscriptionStatusEnum("status").notNull().default("incomplete"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_subscriptions_user").on(table.userId),
    index("idx_subscriptions_stripe_sub").on(table.stripeSubscriptionId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

// ── Webhook Events (idempotency tracking) ────────────
export const stripeWebhookEvents = pgTable(
  "stripe_webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stripeEventId: varchar("stripe_event_id", { length: 255 })
      .notNull()
      .unique(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_stripe_events_event_id").on(table.stripeEventId),
  ]
);

// ── Transcripts (CallGuard) ──────────────────────────
export const transcripts = pgTable(
  "transcripts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recordingId: text("recording_id"),
    application: text("application"),
    startTimeUtc: timestamp("start_time_utc", { withTimezone: true }),
    endTimeUtc: timestamp("end_time_utc", { withTimezone: true }),
    duration: text("duration"),
    modelName: text("model_name"),
    language: text("language"),
    fullText: text("full_text"),
    segments: jsonb("segments"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_transcripts_user").on(table.userId),
    index("idx_transcripts_recording").on(table.recordingId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

// ── Activity Feed ────────────────────────────────────
export const activityEventTypeEnum = pgEnum("activity_event_type", [
  "email.received",
  "email.sent",
  "email.classified",
  "email.draft_created",
  "email.draft_sent",
  "email.labeled",
  "smart_label.triggered",
  "smart_label.created",
  "smart_label.updated",
  "smart_label.folder_synced",
  "card.created",
  "card.moved",
  "card.completed",
  "card.deleted",
  "board.created",
  "decision.created",
  "decision.status_changed",
  "action_item.created",
  "action_item.completed",
  "thought.created",
  "thought.linked",
  "thought.reminder_sent",
  "page.created",
  "page.updated",
  "page.entry_auto_added",
  "meeting.received",
  "meeting.transcript_ready",
  "calendar.event_synced",
  "calendar.connected",
  "integration.connected",
  "integration.webhook_received",
  "weekly_review.generated",
  "daily_briefing.sent",
]);

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventType: activityEventTypeEnum("event_type").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    entityType: varchar("entity_type", { length: 50 }),
    entityId: varchar("entity_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_activity_events_user_created").on(table.userId, table.createdAt),
    index("idx_activity_events_type").on(table.eventType),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);

// ── Admin Action Log ─────────────────────────────────
export const adminActionLogs = pgTable(
  "admin_action_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id")
      .notNull()
      .references(() => users.id),
    action: varchar("action", { length: 100 }).notNull(),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_admin_action_logs_admin").on(table.adminUserId),
  ]
);
