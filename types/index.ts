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

export interface Card {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | null;
  priority: Priority;
  colorLabel: string | null;
  archived: boolean;
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

export type TrashItemType = "card" | "action_item" | "email" | "meeting" | "decision";

export interface TrashItem {
  id: string | number;
  type: TrashItemType;
  title: string;
  deletedAt: string;
  daysRemaining: number;
}
