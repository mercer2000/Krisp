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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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
  dashboardConfig: jsonb("dashboard_config"),
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
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_outlook_oauth_tenant").on(table.tenantId),
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
    rawPayload: jsonb("raw_payload"),
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
  ]
);

// ── Weekly Reviews ──────────────────────────────────
export const weeklyReviewStatusEnum = pgEnum("weekly_review_status", [
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
  ]
);
