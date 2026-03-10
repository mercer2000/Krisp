"use client";

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownComposeProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  generating?: boolean;
  generatingLabel?: string;
  autoFocus?: boolean;
}

export function MarkdownCompose({
  value,
  onChange,
  placeholder = "Write your message in markdown...",
  generating,
  generatingLabel = "Generating draft...",
  autoFocus,
}: MarkdownComposeProps) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || preview) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(120, Math.min(ta.scrollHeight, 300))}px`;
  }, [value, preview]);

  // Focus textarea on mount
  useEffect(() => {
    if (autoFocus && textareaRef.current && !preview) {
      textareaRef.current.focus();
    }
  }, [autoFocus, preview]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Cmd/Ctrl+Shift+P to toggle preview
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPreview((p) => !p);
      }
    },
    []
  );

  const togglePreview = useCallback(() => {
    setPreview((p) => !p);
  }, []);

  return (
    <div className="relative">
      {/* Editor / Preview area */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        {preview ? (
          <div className="px-3 py-2 min-h-[120px] max-h-[300px] overflow-y-auto prose prose-sm prose-invert max-w-none text-sm text-[var(--foreground)]">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-[var(--muted-foreground)] italic">Nothing to preview</p>
            )}
          </div>
        ) : (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={generating ? "" : placeholder}
              className={`w-full px-3 py-2 text-sm font-mono bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none resize-none min-h-[120px] ${
                generating && !value ? "opacity-60" : ""
              }`}
              data-compose-field
            />
            {generating && !value && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {generatingLabel}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview toggle */}
      <div className="flex items-center gap-2 mt-1.5">
        <button
          type="button"
          onClick={togglePreview}
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          {preview ? "Edit" : "Preview"}{" "}
          <kbd className="text-[10px] px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--secondary)]">
            {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "\u2318" : "Ctrl"}+\u21e7+P
          </kbd>
        </button>
      </div>
    </div>
  );
}
