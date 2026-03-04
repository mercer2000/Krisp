"use client";

import { useDroppable } from "@dnd-kit/core";

export const TRASH_ZONE_ID = "trash-zone";

interface TrashDropZoneProps {
  isVisible: boolean;
}

export function TrashDropZone({ isVisible }: TrashDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: TRASH_ZONE_ID,
  });

  return (
    <div
      ref={setNodeRef}
      className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border-2 border-dashed px-6 py-3 transition-all duration-200 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      } ${
        isOver
          ? "scale-110 border-red-500 bg-red-500/20 text-red-400"
          : "border-red-400/50 bg-red-950/80 text-red-300 backdrop-blur-md"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
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
      <span className="text-sm font-medium">
        {isOver ? "Release to delete" : "Drop to delete"}
      </span>
    </div>
  );
}
