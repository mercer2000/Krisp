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
