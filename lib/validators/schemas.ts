import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username must be lowercase alphanumeric with underscores only"
    ),
  email: z.string().email("Invalid email address"),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be at most 100 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const createBoardSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const createColumnSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const updateColumnSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
});

export const reorderColumnsSchema = z.object({
  columnIds: z.array(z.string().uuid()),
});

const checklistItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  done: z.boolean(),
});

export const createCardSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().optional(),
  colorLabel: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  checklist: z.array(checklistItemSchema).nullable().optional(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().nullable().optional(),
  colorLabel: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  archived: z.boolean().optional(),
  checklist: z.array(checklistItemSchema).nullable().optional(),
});

export const moveCardSchema = z.object({
  targetColumnId: z.string().uuid(),
  position: z.number().int().min(0),
});

export const reorderCardsSchema = z.object({
  cardIds: z.array(z.string().uuid()),
});

export const createTagSchema = z.object({
  label: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

// ── Smart Labels ──────────────────────────────────────
export const createSmartLabelSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  prompt: z.string().min(1, "Prompt is required").max(5000),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const updateSmartLabelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  prompt: z.string().min(1).max(5000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  active: z.boolean().optional(),
  autoDraftEnabled: z.boolean().optional(),
  contextWindowMax: z.number().int().min(1).max(10).optional(),
});

export const classifySmartLabelsSchema = z.object({
  itemType: z.enum(["email", "gmail_email", "card", "action_item", "meeting"]),
  itemId: z.string().min(1),
});

export const batchClassifySmartLabelsSchema = z.object({
  itemType: z.enum(["email", "gmail_email", "card", "action_item", "meeting"]),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateSmartLabelInput = z.infer<typeof createSmartLabelSchema>;
export type UpdateSmartLabelInput = z.infer<typeof updateSmartLabelSchema>;
export type ClassifySmartLabelsInput = z.infer<typeof classifySmartLabelsSchema>;
export type BatchClassifySmartLabelsInput = z.infer<typeof batchClassifySmartLabelsSchema>;

// ── Email Webhook ─────────────────────────────────────
export const emailAttachmentSchema = z.object({
  name: z.string(),
  contentType: z.string(),
  size: z.number(),
});

export const emailWebhookPayloadSchema = z.object({
  messageId: z.string().min(1, "messageId is required"),
  from: z.string().min(1, "from is required"),
  to: z.array(z.string()).min(1, "at least one recipient is required"),
  cc: z.array(z.string()).optional(),
  bcc: z.array(z.string()).optional(),
  subject: z.string().optional(),
  bodyPlainText: z.string().optional(),
  bodyHtml: z.string().optional(),
  receivedDateTime: z.string().min(1, "receivedDateTime is required"),
  attachments: z.array(emailAttachmentSchema).optional(),
});

export type EmailWebhookPayloadInput = z.infer<typeof emailWebhookPayloadSchema>;

// ── Gmail Webhook (Pub/Sub Push) ─────────────────────
export const pubSubPushMessageSchema = z.object({
  message: z.object({
    data: z.string().min(1, "data is required"),
    messageId: z.string().min(1, "messageId is required"),
    publishTime: z.string().min(1, "publishTime is required"),
  }),
  subscription: z.string().min(1, "subscription is required"),
});

export type PubSubPushMessageInput = z.infer<typeof pubSubPushMessageSchema>;

// ── Gmail Webhook (Apps Script) ──────────────────────
const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB

export const gmailAppsScriptPayloadSchema = z.object({
  messageId: z.string().min(1, "messageId is required"),
  sender: z.string().min(1, "sender is required"),
  recipients: z.string().min(1, "recipients is required"),
  subject: z.string().optional(),
  bodyPlain: z.string().max(MAX_BODY_SIZE, "body exceeds 5MB limit").optional(),
  bodyHtml: z.string().max(MAX_BODY_SIZE, "body exceeds 5MB limit").optional(),
  receivedAt: z.string().min(1, "receivedAt is required"),
});

export type GmailAppsScriptPayloadInput = z.infer<typeof gmailAppsScriptPayloadSchema>;

// ── Microsoft Graph Change Notification ──────────────
export const graphResourceDataSchema = z.object({
  "@odata.type": z.string().optional(),
  "@odata.id": z.string().optional(),
  "@odata.etag": z.string().optional(),
  id: z.string().optional(),
});

export const graphChangeNotificationSchema = z.object({
  changeType: z.string().min(1),
  clientState: z.string().optional(),
  resource: z.string().min(1),
  resourceData: graphResourceDataSchema.optional(),
  subscriptionId: z.string().min(1),
  subscriptionExpirationDateTime: z.string().min(1),
  tenantId: z.string().optional(),
});

export const graphNotificationPayloadSchema = z.object({
  value: z.array(graphChangeNotificationSchema).min(1),
});

export type GraphChangeNotification = z.infer<typeof graphChangeNotificationSchema>;
export type GraphNotificationPayload = z.infer<typeof graphNotificationPayloadSchema>;

// ── Action Items ─────────────────────────────────────
export const createActionItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().optional(),
  assignee: z.string().max(255).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().optional(),
  meetingId: z.number().int().optional(),
});

export const updateActionItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().nullable().optional(),
  assignee: z.string().max(255).nullable().optional(),
  status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().nullable().optional(),
});

export type CreateActionItemInput = z.infer<typeof createActionItemSchema>;
export type UpdateActionItemInput = z.infer<typeof updateActionItemSchema>;

// ── Decisions ────────────────────────────────────────
export const createDecisionSchema = z.object({
  statement: z.string().min(1, "Decision statement is required"),
  context: z.string().optional(),
  rationale: z.string().optional(),
  participants: z.array(z.string()).optional(),
  category: z.enum(["technical", "process", "budget", "strategic", "other"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  meetingId: z.number().int().optional(),
  emailId: z.number().int().optional(),
  decisionDate: z.string().optional(),
});

export const updateDecisionSchema = z.object({
  statement: z.string().min(1).optional(),
  context: z.string().nullable().optional(),
  rationale: z.string().nullable().optional(),
  participants: z.array(z.string()).optional(),
  category: z.enum(["technical", "process", "budget", "strategic", "other"]).optional(),
  status: z.enum(["active", "reconsidered", "archived"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  annotation: z.string().nullable().optional(),
  decisionDate: z.string().nullable().optional(),
});

export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
export type UpdateDecisionInput = z.infer<typeof updateDecisionSchema>;

// ── Zoom Chat Webhook ───────────────────────────────
export const zoomChatWebhookObjectSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  date_time: z.string().min(1),
  session_id: z.string().optional(),
  contact_id: z.string().optional(),
  contact_email: z.string().optional(),
  channel_id: z.string().optional(),
  channel_name: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.number().optional(),
  operator: z.string().min(1),
  operator_id: z.string().min(1),
  operator_member_id: z.string().optional(),
});

export const zoomChatWebhookPayloadSchema = z.object({
  event: z.string().min(1),
  event_ts: z.number(),
  payload: z.object({
    account_id: z.string().min(1),
    object: zoomChatWebhookObjectSchema,
  }),
});

export type ZoomChatWebhookPayloadInput = z.infer<typeof zoomChatWebhookPayloadSchema>;

// ── Inbox Email List ────────────────────────────────
export const emailListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().max(200).optional(),
  after: z.string().datetime({ offset: true }).optional(),
  before: z.string().datetime({ offset: true }).optional(),
  accountId: z.string().uuid().optional(),
  provider: z.enum(["outlook", "gmail", "zoom"]).optional(),
  folder: z.enum(["inbox", "newsletter", "spam"]).optional(),
});

export type EmailListQueryInput = z.infer<typeof emailListQuerySchema>;

// ── Semantic Email Search ──────────────────────────
export const emailSearchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").max(500),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type EmailSearchQueryInput = z.infer<typeof emailSearchQuerySchema>;

// ── Outbound Webhooks ────────────────────────────────
export const outboundWebhookEventTypes = [
  "card.created",
  "meeting.ingested",
  "email.received",
  "thought.captured",
] as const;

export const createOutboundWebhookSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  url: z.string().url("Must be a valid URL"),
  secret: z.string().max(255).optional(),
  events: z
    .array(z.enum(outboundWebhookEventTypes))
    .min(1, "Select at least one event"),
  active: z.boolean().optional(),
});

export const updateOutboundWebhookSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url("Must be a valid URL").optional(),
  secret: z.string().max(255).nullable().optional(),
  events: z
    .array(z.enum(outboundWebhookEventTypes))
    .min(1, "Select at least one event")
    .optional(),
  active: z.boolean().optional(),
});

export type CreateOutboundWebhookInput = z.infer<typeof createOutboundWebhookSchema>;
export type UpdateOutboundWebhookInput = z.infer<typeof updateOutboundWebhookSchema>;

// ── VIP Contacts ─────────────────────────────────────
export const createVipContactSchema = z.object({
  email: z.string().min(1, "Email is required").max(512),
  displayName: z.string().max(255).optional(),
  notifyOnNew: z.boolean().optional(),
});

export const updateVipContactSchema = z.object({
  displayName: z.string().max(255).nullable().optional(),
  notifyOnNew: z.boolean().optional(),
});

export const batchCheckVipSchema = z.object({
  senders: z.array(z.string()).min(1).max(200),
});

export type CreateVipContactInput = z.infer<typeof createVipContactSchema>;
export type UpdateVipContactInput = z.infer<typeof updateVipContactSchema>;
export type BatchCheckVipInput = z.infer<typeof batchCheckVipSchema>;

// ── Contacts ────────────────────────────────────────
export const contactListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().max(200).optional(),
  sort: z.enum(["frequency", "recent", "name"]).optional(),
});

export type ContactListQueryInput = z.infer<typeof contactListQuerySchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type MoveCardInput = z.infer<typeof moveCardSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
