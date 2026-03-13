export type Priority = "low" | "medium" | "high" | "urgent";

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface Board {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  backgroundColor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  position: number;
  color: string | null;
  createdAt: Date;
}

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export interface Card {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | null;
  priority: Priority;
  colorLabel: string | null;
  checklist: ChecklistItem[] | null;
  archived: boolean;
  snoozedUntil: string | null;
  snoozeReturnColumnId: string | null;
  isBigThree: boolean;
  bigThreeWeekStart: string | null;
  deletedAt: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags?: CardTag[];
}

export interface CardTag {
  id: string;
  cardId: string;
  label: string;
  color: string;
}

export type ActionItemStatus = "open" | "in_progress" | "completed" | "cancelled";

export interface ActionItem {
  id: string;
  userId: string;
  meetingId: number | null;
  cardId: string | null;
  title: string;
  description: string | null;
  assignee: string | null;
  extractionSource: string;
  status: ActionItemStatus;
  priority: Priority;
  dueDate: string | null;
  completedAt: string | null;
  reminderSentAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  meetingTitle?: string | null;
}

export interface ColumnWithCards extends Column {
  cards: Card[];
}

export interface BoardWithColumns extends Board {
  columns: ColumnWithCards[];
}

export interface CalendarEventAttendee {
  email: string;
  name: string;
  response: string;
  type: string;
}

export interface CalendarEvent {
  id: string;
  tenantId: string;
  credentialId: string | null;
  graphEventId: string;
  subject: string | null;
  bodyPreview: string | null;
  bodyHtml: string | null;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  location: string | null;
  organizerEmail: string | null;
  organizerName: string | null;
  attendees: CalendarEventAttendee[];
  webLink: string | null;
  isCancelled: boolean;
  showAs: string | null;
  importance: string | null;
  isRecurring: boolean;
  seriesMasterId: string | null;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type DecisionStatus = "active" | "reconsidered" | "archived";
export type DecisionCategory = "technical" | "process" | "budget" | "strategic" | "other";

export interface Decision {
  id: string;
  userId: string;
  meetingId: number | null;
  emailId: number | null;
  statement: string;
  context: string | null;
  rationale: string | null;
  participants: string[];
  category: DecisionCategory;
  status: DecisionStatus;
  priority: Priority;
  extractionSource: string;
  confidence: number | null;
  annotation: string | null;
  decisionDate: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  meetingTitle?: string | null;
}

// ── Weekly Plans ────────────────────────────────────
export type WeeklyPlanStatus = "planning" | "active" | "assessed";

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  weeklyReviewId: string | null;
  bigThreeCardIds: string[];
  aiAssessment: string | null;
  userReflection: string | null;
  assessmentScore: number | null;
  assessmentEmailSentAt: string | null;
  status: WeeklyPlanStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  dailyThemes?: DailyTheme[];
}

export interface DailyTheme {
  id: string;
  weeklyPlanId: string;
  userId: string;
  date: string;
  theme: string;
  aiRationale: string | null;
  suggestedCardIds: string[];
  isOverridden: boolean;
}

// ── Weekly Reviews ──────────────────────────────────
export type WeeklyReviewStatus = "generating" | "completed" | "failed";

export interface TopicCluster {
  topic: string;
  summary: string;
  sources: Array<{ type: "meeting" | "email" | "decision"; title: string; date: string }>;
}

export interface CrossDayPattern {
  pattern: string;
  occurrences: number;
  details: string;
}

export interface WeeklyReview {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  status: WeeklyReviewStatus;
  topicClusters: TopicCluster[];
  unresolvedActionItems: Array<{ id: string; title: string; priority: string; dueDate: string | null; assignee: string | null }>;
  crossDayPatterns: CrossDayPattern[];
  synthesisReport: string | null;
  meetingCount: number;
  emailCount: number;
  decisionCount: number;
  actionItemCount: number;
  emailSentAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Pages / Workspace ────────────────────────────────
export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export type PageType = "page" | "knowledge" | "decisions";

export interface Page {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  coverUrl: string | null;
  isDatabase: boolean;
  databaseConfig: DatabaseConfig | null;
  isArchived: boolean;
  createdBy: string;
  sortOrder: number;
  // Smart-label-powered page fields
  pageType: PageType;
  color: string | null;
  smartRule: string | null;
  smartActive: boolean;
  smartRuleAccountId: string | null;
  smartRuleFolderId: string | null;
  smartRuleFolderName: string | null;
  createdAt: string;
  updatedAt: string;
  entryCount?: number;
}

export interface PageWithBlocks extends Page {
  blocks: Block[];
}

export type PageEntryType = "knowledge" | "decision" | "email_summary" | "manual";

export interface PageEntry {
  id: string;
  pageId: string;
  entryType: PageEntryType;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  sourceId: string | null;
  sourceType: string | null;
  confidence: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageWithEntries extends Page {
  entries: PageEntry[];
  entryCount: number;
}

export interface Block {
  id: string;
  pageId: string;
  parentBlockId: string | null;
  type: BlockType;
  content: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type BlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "bulleted_list"
  | "numbered_list"
  | "to_do"
  | "toggle"
  | "code"
  | "quote"
  | "divider"
  | "callout"
  | "image"
  | "bookmark";

export interface DatabaseConfig {
  properties: DatabaseProperty[];
  views: DatabaseView[];
}

export interface DatabaseProperty {
  id: string;
  name: string;
  type: "text" | "number" | "select" | "multi_select" | "date" | "checkbox" | "url";
  options: { id: string; name: string; color: string }[];
}

export interface DatabaseView {
  id: string;
  name: string;
  type: "table" | "board";
  group_by?: string;
  filters: DatabaseFilter[];
  sorts: DatabaseSort[];
}

export interface DatabaseFilter {
  propertyId: string;
  operator: string;
  value: unknown;
}

export interface DatabaseSort {
  propertyId: string;
  direction: "ascending" | "descending";
}

export interface DatabaseRow {
  id: string;
  databasePageId: string;
  rowPageId: string | null;
  properties: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type TrashItemType = "card" | "action_item" | "email" | "meeting" | "decision" | "page";

// ── Billing / Subscriptions ────────────────────────────
export type PlanKey = "free" | "standard" | "pro";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete";

export type UserRole = "user" | "admin";

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  stripeCurrentPeriodEnd: string;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrashItem {
  id: string | number;
  type: TrashItemType;
  title: string;
  deletedAt: string;
  daysRemaining: number;
}
