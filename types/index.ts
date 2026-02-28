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

export interface ColumnWithCards extends Column {
  cards: Card[];
}

export interface BoardWithColumns extends Board {
  columns: ColumnWithCards[];
}
