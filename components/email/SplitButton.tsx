"use client";

import { useState, useRef, useEffect } from "react";

interface SplitButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  dropdownLabel: string;
  dropdownIcon?: React.ReactNode;
  onDropdownClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

export function SplitButton({
  label,
  icon,
  onClick,
  dropdownLabel,
  dropdownIcon,
  onDropdownClick,
  active,
  disabled,
}: SplitButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      {/* Main button */}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 p-2 md:pl-3 md:pr-1.5 md:py-1.5 text-sm font-medium rounded-l-lg border border-r-0 border-[var(--border)] transition-colors disabled:opacity-40 ${
          active
            ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"
            : "text-[var(--foreground)] hover:bg-[var(--accent)]"
        }`}
        title={label}
      >
        {icon}
        <span className="hidden md:inline">{label}</span>
      </button>

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className={`inline-flex items-center px-1 md:px-1.5 rounded-r-lg border border-[var(--border)] transition-colors disabled:opacity-40 ${
          active
            ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"
            : "text-[var(--foreground)] hover:bg-[var(--accent)]"
        }`}
        title={`${label} options`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 min-w-[180px] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDropdownClick();
            }}
            className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] flex items-center gap-2"
          >
            {dropdownIcon || (
              <span className="text-[var(--primary)]" style={{ fontSize: "12px" }}>
                ✦
              </span>
            )}
            {dropdownLabel}
          </button>
        </div>
      )}
    </div>
  );
}
