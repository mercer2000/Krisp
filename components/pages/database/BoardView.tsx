"use client";

import { useCallback } from "react";
import { useUpdateDatabaseRow, useCreateDatabaseRow } from "@/lib/hooks/useDatabaseRows";
import type { DatabaseProperty, DatabaseRow } from "@/types";

interface BoardViewProps {
  rows: DatabaseRow[];
  properties: DatabaseProperty[];
  groupByPropertyId: string;
  databasePageId: string;
  onAddRow: () => void;
}

export function BoardView({
  rows,
  properties,
  groupByPropertyId,
  databasePageId,
}: BoardViewProps) {
  const groupProp = properties.find((p) => p.id === groupByPropertyId);
  const updateRow = useUpdateDatabaseRow(databasePageId);
  const createRow = useCreateDatabaseRow(databasePageId);

  // Group rows by property value
  const columns = groupProp
    ? [
        ...groupProp.options.map((opt) => ({
          id: opt.id,
          name: opt.name,
          color: opt.color,
          rows: rows.filter((r) => {
            const props = r.properties as Record<string, unknown>;
            return props[groupByPropertyId] === opt.id;
          }),
        })),
        {
          id: "__none__",
          name: "No Status",
          color: "#94a3b8",
          rows: rows.filter((r) => {
            const props = r.properties as Record<string, unknown>;
            return !props[groupByPropertyId];
          }),
        },
      ]
    : [{ id: "__all__", name: "All", color: "#94a3b8", rows }];

  const handleDrop = useCallback(
    (rowId: string, targetColumnId: string) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;
      const props = row.properties as Record<string, unknown>;
      const newValue = targetColumnId === "__none__" ? null : targetColumnId;
      updateRow.mutate({
        rowId,
        properties: { ...props, [groupByPropertyId]: newValue },
      });
    },
    [rows, updateRow, groupByPropertyId]
  );

  const handleAddToColumn = (columnId: string) => {
    const initialProps: Record<string, unknown> = {};
    if (columnId !== "__none__" && columnId !== "__all__") {
      initialProps[groupByPropertyId] = columnId;
    }
    createRow.mutate({ properties: initialProps, title: "" });
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div
          key={col.id}
          className="flex w-64 shrink-0 flex-col rounded-lg bg-[var(--muted)]/50"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("ring-2", "ring-[var(--primary)]/30");
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove("ring-2", "ring-[var(--primary)]/30");
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("ring-2", "ring-[var(--primary)]/30");
            const rowId = e.dataTransfer.getData("text/plain");
            if (rowId) handleDrop(rowId, col.id);
          }}
        >
          {/* Column header */}
          <div className="flex items-center gap-2 px-3 py-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: col.color }}
            />
            <span className="text-sm font-medium text-[var(--foreground)]">
              {col.name}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {col.rows.length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex-1 space-y-1.5 px-2 pb-2">
            {col.rows.map((row) => (
              <BoardCard
                key={row.id}
                row={row}
                properties={properties}
                groupByPropertyId={groupByPropertyId}
              />
            ))}

            {/* Add card button */}
            <button
              className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              onClick={() => handleAddToColumn(col.id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function BoardCard({
  row,
  properties,
  groupByPropertyId,
}: {
  row: DatabaseRow;
  properties: DatabaseProperty[];
  groupByPropertyId: string;
}) {
  const props = row.properties as Record<string, unknown>;
  const title = (props.title as string) || "Untitled";

  // Show up to 3 non-grouped properties
  const previewProps = properties
    .filter((p) => p.id !== groupByPropertyId)
    .slice(0, 3);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", row.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="cursor-grab rounded-md border border-[var(--border)] bg-[var(--card)] p-2.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <p className="text-sm font-medium text-[var(--foreground)] mb-1">{title}</p>
      {previewProps.map((prop) => {
        const val = props[prop.id];
        if (val == null) return null;

        if (prop.type === "select") {
          const opt = prop.options.find((o) => o.id === val);
          if (!opt) return null;
          return (
            <span
              key={prop.id}
              className="mr-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${opt.color}20`, color: opt.color }}
            >
              {opt.name}
            </span>
          );
        }

        if (prop.type === "date" && typeof val === "string") {
          return (
            <span key={prop.id} className="mr-1 text-xs text-[var(--muted-foreground)]">
              {val}
            </span>
          );
        }

        if (prop.type === "checkbox") {
          return (
            <span key={prop.id} className="mr-1 text-xs">
              {val ? "✅" : "☐"}
            </span>
          );
        }

        return null;
      })}
    </div>
  );
}
