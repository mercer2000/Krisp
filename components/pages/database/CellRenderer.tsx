"use client";

import { useState } from "react";
import type { DatabaseProperty } from "@/types";

interface CellRendererProps {
  property: DatabaseProperty;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function CellRenderer({ property, value, onChange }: CellRendererProps) {
  switch (property.type) {
    case "text":
      return <TextCell value={value as string} onChange={onChange} />;
    case "number":
      return <NumberCell value={value as number} onChange={onChange} />;
    case "select":
      return (
        <SelectCell
          value={value as string}
          options={property.options}
          onChange={onChange}
        />
      );
    case "multi_select":
      return (
        <MultiSelectCell
          value={(value as string[]) || []}
          options={property.options}
          onChange={onChange}
        />
      );
    case "date":
      return <DateCell value={value as string} onChange={onChange} />;
    case "checkbox":
      return <CheckboxCell value={value as boolean} onChange={onChange} />;
    case "url":
      return <UrlCell value={value as string} onChange={onChange} />;
    default:
      return <span className="text-[var(--muted-foreground)]">—</span>;
  }
}

function TextCell({ value, onChange }: { value: string; onChange: (v: unknown) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || "");

  if (editing) {
    return (
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onChange(text);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditing(false);
            onChange(text);
          }
          if (e.key === "Escape") setEditing(false);
        }}
        autoFocus
        className="w-full rounded border border-[var(--border)] bg-transparent px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-[var(--ring)]"
      />
    );
  }

  return (
    <span
      className="cursor-text text-[var(--foreground)]"
      onClick={() => setEditing(true)}
    >
      {value || <span className="text-[var(--muted-foreground)]/40">Empty</span>}
    </span>
  );
}

function NumberCell({ value, onChange }: { value: number; onChange: (v: unknown) => void }) {
  const [editing, setEditing] = useState(false);
  const [num, setNum] = useState(value?.toString() || "");

  if (editing) {
    return (
      <input
        type="number"
        value={num}
        onChange={(e) => setNum(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onChange(num ? Number(num) : null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditing(false);
            onChange(num ? Number(num) : null);
          }
        }}
        autoFocus
        className="w-full rounded border border-[var(--border)] bg-transparent px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-[var(--ring)]"
      />
    );
  }

  return (
    <span className="cursor-text" onClick={() => setEditing(true)}>
      {value != null ? value : <span className="text-[var(--muted-foreground)]/40">—</span>}
    </span>
  );
}

function SelectCell({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; name: string; color: string }[];
  onChange: (v: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: selected ? `${selected.color}20` : undefined,
          color: selected?.color,
        }}
        onClick={() => setOpen(!open)}
      >
        {selected?.name || <span className="text-[var(--muted-foreground)]">Select...</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-7 z-50 min-w-[140px] rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg">
            {options.map((opt) => (
              <button
                key={opt.id}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--accent)]"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: opt.color }}
                />
                {opt.name}
              </button>
            ))}
            <button
              className="flex w-full items-center px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MultiSelectCell({
  value,
  options,
  onChange,
}: {
  value: string[];
  options: { id: string; name: string; color: string }[];
  onChange: (v: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((o) => value.includes(o.id));

  const toggle = (optId: string) => {
    const next = value.includes(optId)
      ? value.filter((v) => v !== optId)
      : [...value, optId];
    onChange(next);
  };

  return (
    <div className="relative">
      <button
        className="flex flex-wrap items-center gap-1"
        onClick={() => setOpen(!open)}
      >
        {selected.length > 0 ? (
          selected.map((opt) => (
            <span
              key={opt.id}
              className="rounded px-1.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${opt.color}20`, color: opt.color }}
            >
              {opt.name}
            </span>
          ))
        ) : (
          <span className="text-xs text-[var(--muted-foreground)]">Select...</span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-7 z-50 min-w-[140px] rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg">
            {options.map((opt) => (
              <button
                key={opt.id}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--accent)]"
                onClick={() => toggle(opt.id)}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    value.includes(opt.id)
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--border)]"
                  }`}
                >
                  {value.includes(opt.id) && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: opt.color }}
                />
                {opt.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DateCell({ value, onChange }: { value: string; onChange: (v: unknown) => void }) {
  return (
    <input
      type="date"
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-[var(--foreground)] outline-none hover:border-[var(--border)] focus:border-[var(--ring)]"
    />
  );
}

function CheckboxCell({ value, onChange }: { value: boolean; onChange: (v: unknown) => void }) {
  return (
    <input
      type="checkbox"
      checked={value || false}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
    />
  );
}

function UrlCell({ value, onChange }: { value: string; onChange: (v: unknown) => void }) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(value || "");

  if (editing) {
    return (
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onChange(url || null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditing(false);
            onChange(url || null);
          }
        }}
        autoFocus
        placeholder="https://..."
        className="w-full rounded border border-[var(--border)] bg-transparent px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-[var(--ring)]"
      />
    );
  }

  return value ? (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--primary)] text-sm hover:underline truncate block max-w-[200px]"
      onClick={(e) => e.stopPropagation()}
    >
      {value}
    </a>
  ) : (
    <span
      className="cursor-text text-[var(--muted-foreground)]/40 text-sm"
      onClick={() => setEditing(true)}
    >
      Add URL
    </span>
  );
}
