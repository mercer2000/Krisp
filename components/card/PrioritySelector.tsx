"use client";

import { useState, useRef, useEffect } from "react";
import type { Priority } from "@/types";

const PRIORITY_OPTIONS: {
  value: Priority;
  label: string;
  color: string;
}[] = [
  { value: "low", label: "Low", color: "#22c55e" },
  { value: "medium", label: "Medium", color: "#3b82f6" },
  { value: "high", label: "High", color: "#f97316" },
  { value: "urgent", label: "Urgent", color: "#ef4444" },
];

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

export default function PrioritySelector({
  value,
  onChange,
}: PrioritySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = PRIORITY_OPTIONS.find((o) => o.value === value)!;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        Priority
      </label>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="
            inline-flex items-center gap-2 rounded-md border px-3 py-1.5
            text-sm font-medium transition-colors
            hover:bg-accent
          "
          style={{ borderColor: "var(--border)" }}
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: current.color }}
          />
          {current.label}
        </button>

        {isOpen && (
          <div
            className="
              absolute left-0 top-full z-50 mt-1 min-w-[160px]
              rounded-md border bg-popover p-1 shadow-md
            "
            style={{ borderColor: "var(--border)" }}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  flex w-full items-center gap-2 rounded-sm px-2 py-1.5
                  text-sm transition-colors hover:bg-accent
                  ${option.value === value ? "bg-accent" : ""}
                `}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
