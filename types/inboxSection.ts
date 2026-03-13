/** Filter criteria for an inbox section pane */
export interface InboxSectionFilterCriteria {
  provider?: "outlook" | "gmail" | "zoom";
  accountId?: string;
  labelId?: string;
  smartLabelId?: string;
  senderDomain?: string;
  unreadOnly?: boolean;
  folder?: "inbox" | "spam" | "done" | "all";
}

/** An inbox section definition */
export interface InboxSection {
  id: string;
  name: string;
  filterCriteria: InboxSectionFilterCriteria;
  color: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/** A saved split-view layout */
export interface InboxLayout {
  id: string;
  name: string;
  leftSectionId: string | null;
  rightSectionId: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Client-side split view state (persisted to localStorage) */
export interface SplitViewState {
  enabled: boolean;
  leftSectionId: string | null;
  rightSectionId: string | null;
}
