"use client";

import { CalendarDays, X } from "lucide-react";

interface DueDatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
}

function isOverdue(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  return due < today;
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DueDatePicker({ value, onChange }: DueDatePickerProps) {
  const overdue = value ? isOverdue(value) : false;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        Due Date
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex items-center">
          <CalendarDays className="pointer-events-none absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="
              h-9 rounded-md border bg-transparent pl-9 pr-3
              text-sm transition-colors
              hover:bg-accent focus:outline-none focus:ring-2
              focus:ring-ring focus:ring-offset-2
            "
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="
              inline-flex h-9 w-9 items-center justify-center rounded-md
              border text-muted-foreground transition-colors
              hover:bg-destructive/10 hover:text-destructive
            "
            style={{ borderColor: "var(--border)" }}
            title="Clear due date"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {value && overdue && (
          <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-500">
            Overdue
          </span>
        )}

        {!value && (
          <span className="text-sm text-muted-foreground">No due date</span>
        )}
      </div>
    </div>
  );
}
