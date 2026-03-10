"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailChipInputProps {
  label: string;
  emails: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function EmailChipInput({
  label,
  emails,
  onChange,
  placeholder = "Add email...",
  autoFocus,
}: EmailChipInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmail = useCallback(
    (raw: string) => {
      const email = raw.trim().toLowerCase();
      if (!email) return;
      if (!EMAIL_REGEX.test(email)) {
        setError(true);
        return;
      }
      if (emails.includes(email)) {
        setInputValue("");
        return;
      }
      onChange([...emails, email]);
      setInputValue("");
      setError(false);
    },
    [emails, onChange]
  );

  const removeEmail = useCallback(
    (email: string) => {
      onChange(emails.filter((e) => e !== email));
    },
    [emails, onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      if (inputValue.trim()) {
        e.preventDefault();
        addEmail(inputValue);
      } else if (e.key === "Tab") {
        // Allow normal tab behavior when input is empty
        return;
      }
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      removeEmail(emails[emails.length - 1]);
    }
    setError(false);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    // Handle pasting multiple comma/semicolon-separated emails
    if (text.includes(",") || text.includes(";")) {
      e.preventDefault();
      const parts = text.split(/[,;]\s*/).filter(Boolean);
      const newEmails = [...emails];
      for (const part of parts) {
        const email = part.trim().toLowerCase();
        if (EMAIL_REGEX.test(email) && !newEmails.includes(email)) {
          newEmails.push(email);
        }
      }
      onChange(newEmails);
      setInputValue("");
    }
  };

  return (
    <div
      className={`flex items-center gap-1.5 flex-wrap px-3 py-1.5 rounded-lg border bg-[var(--card)] transition-colors ${
        error
          ? "border-[var(--destructive)]"
          : "border-[var(--border)] focus-within:border-[var(--ring)]"
      }`}
      onClick={() => inputRef.current?.focus()}
    >
      <span className="text-xs font-medium text-[var(--muted-foreground)] w-8 flex-shrink-0 select-none">
        {label}
      </span>
      {emails.map((email) => (
        <span
          key={email}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--secondary)] text-xs text-[var(--foreground)] max-w-[200px] group"
        >
          <span className="truncate">{email}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeEmail(email);
            }}
            className="opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-opacity flex-shrink-0"
            tabIndex={-1}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setError(false);
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => {
          if (inputValue.trim()) addEmail(inputValue);
        }}
        placeholder={emails.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none"
        autoFocus={autoFocus}
        data-compose-field
      />
    </div>
  );
}
