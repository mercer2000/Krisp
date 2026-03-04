import type { Priority } from "@/types";

// ── Intent Types ────────────────────────────────────

export type BrainIntentType =
  | "brain_query"
  | "create_card"
  | "move_card"
  | "update_card"
  | "archive_card"
  | "restore_card"
  | "query_cards"
  | "confirm_action"
  | "clarify";

export interface CreateCardData {
  title: string;
  description?: string;
  dueDate?: string; // ISO 8601
  priority?: Priority;
  tags?: string[];
  targetColumn?: string;
  targetBoard?: string;
}

export interface MoveCardData {
  cardReference: string;
  targetColumn: string;
}

export interface UpdateCardData {
  cardReference: string;
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
}

export interface ArchiveCardData {
  cardReference: string;
}

export interface RestoreCardData {
  cardReference: string;
}

export interface QueryCardsData {
  status?: string; // column name filter
  priority?: Priority;
  overdue?: boolean;
  boardName?: string;
}

export interface ConfirmActionData {
  confirmed: boolean;
}

export interface ClarifyData {
  message: string;
}

export interface BrainIntent {
  type: BrainIntentType;
  data:
    | CreateCardData
    | MoveCardData
    | UpdateCardData
    | ArchiveCardData
    | RestoreCardData
    | QueryCardsData
    | ConfirmActionData
    | ClarifyData
    | Record<string, never>; // for brain_query
}

// ── Action Results ──────────────────────────────────

export interface ActionResult {
  success: boolean;
  message: string;
  needsConfirmation?: boolean;
  candidates?: Array<{ id: string; title: string; columnName: string }>;
  cardId?: string;
}

// ── Pending Action (stored in session JSONB) ────────

export interface PendingAction {
  type: "archive_card";
  cardId: string;
  cardTitle: string;
  createdAt: string; // ISO timestamp
}

// ── Board Context (passed to intent classifier) ─────

export interface BoardContext {
  boards: Array<{
    id: string;
    title: string;
    columns: Array<{ id: string; title: string; position: number }>;
  }>;
  defaultBoardId: string | null;
}
