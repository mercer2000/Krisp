"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useAddTag, useDeleteTag } from "@/lib/hooks/useCards";
import type { CardTag } from "@/types";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

interface TagManagerProps {
  tags: CardTag[];
  cardId: string;
  boardId: string;
}

export default function TagManager({ tags, cardId, boardId }: TagManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const addTag = useAddTag(boardId);
  const deleteTag = useDeleteTag(boardId);

  function handleAddTag() {
    const label = newLabel.trim();
    if (!label) return;

    addTag.mutate({
      cardId,
      label,
      color: selectedColor,
    });

    setNewLabel("");
    setSelectedColor(PRESET_COLORS[0]);
    setIsAdding(false);
  }

  function handleRemoveTag(tagId: string) {
    deleteTag.mutate(tagId);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === "Escape") {
      setIsAdding(false);
      setNewLabel("");
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">Tags</label>

      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="
              inline-flex items-center gap-1 rounded-full px-2.5 py-0.5
              text-xs font-medium text-white
            "
            style={{ backgroundColor: tag.color }}
          >
            {tag.label}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="
                ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center
                rounded-full transition-colors hover:bg-white/30
              "
              title={`Remove tag "${tag.label}"`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}

        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="
              inline-flex items-center gap-1 rounded-full border
              border-dashed px-2.5 py-0.5 text-xs text-muted-foreground
              transition-colors hover:border-foreground/40
              hover:text-foreground
            "
            style={{ borderColor: "var(--border)" }}
          >
            <Plus className="h-3 w-3" />
            Add tag
          </button>
        )}
      </div>

      {isAdding && (
        <div
          className="
            space-y-3 rounded-md border p-3
          "
          style={{ borderColor: "var(--border)" }}
        >
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tag label..."
            autoFocus
            className="
              h-8 w-full rounded-md border bg-transparent px-2.5
              text-sm placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring
            "
            style={{ borderColor: "var(--border)" }}
          />

          <div className="flex items-center gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`
                  h-6 w-6 rounded-full transition-all hover:scale-110
                  ${
                    selectedColor === color
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      : ""
                  }
                `}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!newLabel.trim() || addTag.isPending}
              className="
                rounded-md bg-primary px-3 py-1.5 text-xs font-medium
                text-primary-foreground transition-colors
                hover:bg-primary/90 disabled:opacity-50
              "
            >
              {addTag.isPending ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewLabel("");
              }}
              className="
                rounded-md px-3 py-1.5 text-xs text-muted-foreground
                transition-colors hover:text-foreground
              "
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
