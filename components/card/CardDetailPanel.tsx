"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Trash2, Archive } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useUpdateCard, useDeleteCard } from "@/lib/hooks/useCards";
import type { Card } from "@/types";
import ColorLabelPicker from "./ColorLabelPicker";
import PrioritySelector from "./PrioritySelector";
import DueDatePicker from "./DueDatePicker";
import MarkdownEditor from "./MarkdownEditor";
import TagManager from "./TagManager";

interface CardDetailPanelProps {
  card: Card | null;
  boardId: string;
  onClose: () => void;
}

export default function CardDetailPanel({
  card,
  boardId,
  onClose,
}: CardDetailPanelProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateCard = useUpdateCard(boardId);
  const deleteCard = useDeleteCard(boardId);

  // Sync title value when card changes
  useEffect(() => {
    if (card) {
      setTitleValue(card.title);
    }
  }, [card]);

  // Reset confirm delete when card changes
  useEffect(() => {
    setConfirmDelete(false);
  }, [card?.id]);

  // Focus title input when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const saveTitle = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!card || !trimmed || trimmed === card.title) return;
      updateCard.mutate({ id: card.id, title: trimmed });
    },
    [card, updateCard],
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTitleValue(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        saveTitle(value);
      }, 300);
    },
    [saveTitle],
  );

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        saveTitle(titleValue);
        setEditingTitle(false);
      }
      if (e.key === "Escape") {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        setTitleValue(card?.title ?? "");
        setEditingTitle(false);
      }
    },
    [saveTitle, titleValue, card?.title],
  );

  const handleTitleBlur = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    saveTitle(titleValue);
    setEditingTitle(false);
  }, [saveTitle, titleValue]);

  function handleDelete() {
    if (!card) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteCard.mutate(card.id);
    onClose();
  }

  function handleArchive() {
    if (!card) return;
    updateCard.mutate({ id: card.id, archived: !card.archived });
  }

  if (!card) return null;

  return (
    <Drawer open={!!card} onClose={onClose}>
      <div className="flex h-full flex-col overflow-y-auto">
        {/* Color label stripe */}
        {card.colorLabel && (
          <div
            className="h-2 w-full shrink-0 rounded-t-md"
            style={{ backgroundColor: card.colorLabel }}
          />
        )}

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Title */}
          <div>
            {editingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={titleValue}
                onChange={handleTitleChange}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleTitleBlur}
                className="
                  w-full rounded-md border bg-transparent px-2 py-1
                  text-lg font-semibold focus:outline-none focus:ring-2
                  focus:ring-ring
                "
                style={{ borderColor: "var(--border)" }}
              />
            ) : (
              <h2
                className="
                  cursor-pointer rounded-md px-2 py-1 text-lg font-semibold
                  transition-colors hover:bg-accent
                "
                onClick={() => setEditingTitle(true)}
                title="Click to edit title"
              >
                {card.title}
              </h2>
            )}
          </div>

          {/* Color Label Picker */}
          <ColorLabelPicker
            value={card.colorLabel}
            onChange={(color) =>
              updateCard.mutate({ id: card.id, colorLabel: color })
            }
          />

          {/* Priority Selector */}
          <PrioritySelector
            value={card.priority}
            onChange={(priority) =>
              updateCard.mutate({ id: card.id, priority })
            }
          />

          {/* Due Date Picker */}
          <DueDatePicker
            value={card.dueDate}
            onChange={(dueDate) =>
              updateCard.mutate({ id: card.id, dueDate })
            }
          />

          {/* Description / Markdown Editor */}
          <MarkdownEditor
            value={card.description ?? ""}
            onChange={(description) =>
              updateCard.mutate({ id: card.id, description })
            }
            isEditing={false}
          />

          {/* Tags */}
          <TagManager
            tags={card.tags ?? []}
            cardId={card.id}
            boardId={boardId}
          />

          {/* Actions */}
          <div
            className="
              flex items-center gap-2 border-t pt-4
            "
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={handleArchive}
              className="
                inline-flex items-center gap-2 rounded-md border px-3 py-2
                text-sm font-medium transition-colors hover:bg-accent
              "
              style={{ borderColor: "var(--border)" }}
            >
              <Archive className="h-4 w-4" />
              {card.archived ? "Unarchive" : "Archive"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className={`
                inline-flex items-center gap-2 rounded-md px-3 py-2
                text-sm font-medium transition-colors
                ${
                  confirmDelete
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "border text-destructive hover:bg-destructive/10"
                }
              `}
              style={!confirmDelete ? { borderColor: "var(--border)" } : undefined}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? "Confirm Delete" : "Delete"}
            </button>

            {confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="
                  rounded-md px-3 py-2 text-sm text-muted-foreground
                  transition-colors hover:text-foreground
                "
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
