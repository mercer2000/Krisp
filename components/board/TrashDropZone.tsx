"use client";

import { useDroppable } from "@dnd-kit/core";

export const TRASH_ZONE_ID = "trash-zone";

interface TrashDropZoneProps {
  isVisible: boolean;
  selectedCount?: number;
}

export function TrashDropZone({ isVisible, selectedCount = 0 }: TrashDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: TRASH_ZONE_ID,
  });

  const label = selectedCount > 1
    ? isOver ? `Delete ${selectedCount} cards` : `Drop to delete ${selectedCount} cards`
    : isOver ? "Release to delete" : "Drop here to delete";

  return (
    <div
      ref={setNodeRef}
      className={`fixed left-0 top-0 z-50 flex h-full w-[200px] flex-col items-center justify-center gap-3 transition-all duration-200 ${
        isVisible
          ? "opacity-100"
          : "pointer-events-none opacity-0"
      } ${
        isOver
          ? "bg-red-500/20 backdrop-blur-sm"
          : "bg-gradient-to-r from-red-950/60 to-transparent backdrop-blur-[2px]"
      }`}
    >
      <div
        className={`flex flex-col items-center gap-2 transition-transform duration-200 ${
          isOver ? "scale-110" : "scale-100"
        }`}
      >
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed transition-colors ${
            isOver
              ? "border-red-400 bg-red-500/30 text-red-300"
              : "border-red-400/50 bg-red-950/50 text-red-400/70"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </div>
        <span
          className={`text-xs font-medium transition-colors ${
            isOver ? "text-red-300" : "text-red-400/70"
          }`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
