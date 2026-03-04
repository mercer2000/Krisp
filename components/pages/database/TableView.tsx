"use client";

import { useState, useCallback } from "react";
import { useUpdateDatabaseRow } from "@/lib/hooks/useDatabaseRows";
import type { DatabaseProperty, DatabaseRow } from "@/types";
import { CellRenderer } from "./CellRenderer";

interface TableViewProps {
  rows: DatabaseRow[];
  properties: DatabaseProperty[];
  databasePageId: string;
  onAddRow: () => void;
}

export function TableView({ rows, properties, databasePageId, onAddRow }: TableViewProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)] min-w-[200px]">
              Title
            </th>
            {properties.map((prop) => (
              <th
                key={prop.id}
                className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)] min-w-[150px]"
              >
                {prop.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              row={row}
              properties={properties}
              databasePageId={databasePageId}
            />
          ))}
        </tbody>
      </table>

      {/* Add row button */}
      <button
        className="mt-1 flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
        onClick={onAddRow}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New
      </button>
    </div>
  );
}

function TableRow({
  row,
  properties,
  databasePageId,
}: {
  row: DatabaseRow;
  properties: DatabaseProperty[];
  databasePageId: string;
}) {
  const updateRow = useUpdateDatabaseRow(databasePageId);
  const props = row.properties as Record<string, unknown>;

  const handlePropertyChange = useCallback(
    (propertyId: string, value: unknown) => {
      updateRow.mutate({
        rowId: row.id,
        properties: { ...props, [propertyId]: value },
      });
    },
    [updateRow, row.id, props]
  );

  // Get title from properties or linked page
  const title = (props.title as string) || "Untitled";

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--accent)]/50 transition-colors">
      <td className="px-3 py-2 font-medium text-[var(--foreground)]">
        {title}
      </td>
      {properties.map((prop) => (
        <td key={prop.id} className="px-3 py-2">
          <CellRenderer
            property={prop}
            value={props[prop.id]}
            onChange={(value) => handlePropertyChange(prop.id, value)}
          />
        </td>
      ))}
    </tr>
  );
}
