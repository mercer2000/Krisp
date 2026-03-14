"use client";

import {
  getViewTitle,
  getAccountColor,
  type CalendarAccount,
  type ViewType,
} from "@/components/calendar/calendarUtils";

interface CalendarHeaderProps {
  currentDate: Date;
  activeView: ViewType;
  accounts: CalendarAccount[];
  visibleAccounts: Set<string>;
  isSyncing: boolean;
  onNavigate: (direction: "prev" | "next") => void;
  onToday: () => void;
  onViewChange: (view: ViewType) => void;
  onToggleAccount: (accountId: string) => void;
  onSync: () => void;
}

const VIEW_OPTIONS: { value: ViewType; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
  { value: "agenda", label: "Agenda" },
];

function ChevronLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 12L6 8L10 4" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4L10 8L6 12" />
    </svg>
  );
}

export function CalendarHeader({
  currentDate,
  activeView,
  accounts,
  visibleAccounts,
  isSyncing,
  onNavigate,
  onToday,
  onViewChange,
  onToggleAccount,
  onSync,
}: CalendarHeaderProps) {
  const title = getViewTitle(activeView, currentDate);

  return (
    <div className="space-y-2">
      {/* Row 1: Navigation + View Toggle + Sync */}
      <div className="flex items-center justify-between">
        {/* Left side: nav buttons + title */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onNavigate("prev")}
            className="text-muted-foreground hover:bg-accent rounded-md border p-1.5"
          >
            <ChevronLeft />
          </button>

          <button
            type="button"
            onClick={onToday}
            className="rounded-md border px-2.5 py-1 text-xs font-medium"
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => onNavigate("next")}
            className="text-muted-foreground hover:bg-accent rounded-md border p-1.5"
          >
            <ChevronRight />
          </button>

          <h2 className="ml-2 text-lg font-semibold tracking-tight">
            {title}
          </h2>
        </div>

        {/* Right side: view toggle + sync */}
        <div className="flex items-center gap-2">
          {/* View toggle group */}
          <div className="bg-card flex items-center rounded-lg border p-0.5">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onViewChange(option.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeView === option.value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Sync button */}
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="bg-primary rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : "Sync"}
          </button>
        </div>
      </div>

      {/* Row 2: Account filter chips */}
      {accounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {accounts.map((account) => {
            const color = getAccountColor(account.id, accounts);
            const isVisible = visibleAccounts.has(account.id);

            return (
              <button
                key={account.id}
                type="button"
                onClick={() => onToggleAccount(account.id)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-opacity ${
                  isVisible
                    ? "border opacity-100"
                    : "opacity-50"
                }`}
              >
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color.border }}
                />
                <span>{account.email}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
