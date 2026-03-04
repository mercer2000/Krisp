"use client";

import { useState } from "react";
import { useDatabaseRows, useCreateDatabaseRow } from "@/lib/hooks/useDatabaseRows";
import { useUpdateDatabaseConfig } from "@/lib/hooks/useDatabaseRows";
import type { Page, DatabaseConfig, DatabaseProperty, DatabaseRow } from "@/types";
import { TableView } from "./TableView";
import { BoardView } from "./BoardView";

interface DatabaseViewProps {
  page: Page;
}

const DEFAULT_CONFIG: DatabaseConfig = {
  properties: [
    {
      id: "prop_status",
      name: "Status",
      type: "select",
      options: [
        { id: "opt_ns", name: "Not Started", color: "#94a3b8" },
        { id: "opt_ip", name: "In Progress", color: "#3b82f6" },
        { id: "opt_done", name: "Done", color: "#22c55e" },
      ],
    },
    {
      id: "prop_priority",
      name: "Priority",
      type: "select",
      options: [
        { id: "opt_high", name: "High", color: "#ef4444" },
        { id: "opt_med", name: "Medium", color: "#eab308" },
        { id: "opt_low", name: "Low", color: "#94a3b8" },
      ],
    },
  ],
  views: [
    { id: "view_table", name: "Table", type: "table", filters: [], sorts: [] },
    {
      id: "view_board",
      name: "Board",
      type: "board",
      group_by: "prop_status",
      filters: [],
      sorts: [],
    },
  ],
};

export function DatabaseView({ page }: DatabaseViewProps) {
  const config = (page.databaseConfig as DatabaseConfig) || DEFAULT_CONFIG;
  const [activeViewId, setActiveViewId] = useState(config.views[0]?.id || "view_table");
  const { data: rows = [] } = useDatabaseRows(page.id);
  const createRow = useCreateDatabaseRow(page.id);

  const activeView = config.views.find((v) => v.id === activeViewId) || config.views[0];

  const handleAddRow = () => {
    createRow.mutate({ properties: {}, title: "" });
  };

  return (
    <div>
      {/* View tabs */}
      <div className="mb-4 flex items-center gap-1 border-b border-[var(--border)]">
        {config.views.map((view) => (
          <button
            key={view.id}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              view.id === activeViewId
                ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
            onClick={() => setActiveViewId(view.id)}
          >
            {view.type === "table" ? "⊞" : "⊟"} {view.name}
          </button>
        ))}
      </div>

      {/* View content */}
      {activeView?.type === "table" ? (
        <TableView
          rows={rows}
          properties={config.properties}
          databasePageId={page.id}
          onAddRow={handleAddRow}
        />
      ) : activeView?.type === "board" ? (
        <BoardView
          rows={rows}
          properties={config.properties}
          groupByPropertyId={activeView.group_by || ""}
          databasePageId={page.id}
          onAddRow={handleAddRow}
        />
      ) : null}
    </div>
  );
}
