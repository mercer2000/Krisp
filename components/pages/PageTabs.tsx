"use client";

import type { Page } from "@/types";

export type PageTab = "notes" | "knowledge" | "decisions" | "smart-rules" | "activity";

const TAB_CONFIG: { id: PageTab; label: string; icon: string }[] = [
  { id: "notes", label: "Notes", icon: "📝" },
  { id: "knowledge", label: "Knowledge", icon: "🧠" },
  { id: "decisions", label: "Decisions", icon: "⚖️" },
  { id: "smart-rules", label: "Smart Rules", icon: "✨" },
  { id: "activity", label: "Activity", icon: "📋" },
];

interface PageTabsProps {
  page: Page;
  activeTab: PageTab;
  onTabChange: (tab: PageTab) => void;
  entryCounts?: { knowledge: number; decisions: number };
}

export function PageTabs({ page, activeTab, onTabChange, entryCounts }: PageTabsProps) {
  return (
    <div className="mb-6 border-b border-[var(--border)]">
      <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Page tabs">
        {TAB_CONFIG.map((tab) => {
          const isActive = activeTab === tab.id;
          const count =
            tab.id === "knowledge"
              ? entryCounts?.knowledge
              : tab.id === "decisions"
                ? entryCounts?.decisions
                : undefined;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-[var(--primary)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              {tab.label}
              {count !== undefined && count > 0 && (
                <span className="ml-1 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
