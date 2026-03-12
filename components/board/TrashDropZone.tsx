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
    ? isOver ? `Delete ${selectedCount} cards` : `Drop to delete ${selectedCount}`
    : isOver ? "Release to delete" : "Drop to delete";

  return (
    <div
      ref={setNodeRef}
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl px-6 py-3 transition-all duration-200 ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 translate-y-4"
      } ${
        isOver
          ? "bg-red-500 shadow-lg shadow-red-500/30 scale-105"
          : "bg-red-950/80 backdrop-blur-md border border-red-500/30 shadow-lg"
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed transition-colors ${
          isOver
            ? "border-white/60 text-white"
            : "border-red-400/50 text-red-400"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
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
        className={`text-sm font-medium whitespace-nowrap transition-colors ${
          isOver ? "text-white" : "text-red-300"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
