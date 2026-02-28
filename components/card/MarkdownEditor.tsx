"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Pencil } from "lucide-react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const MDPreview = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown),
  { ssr: false }
);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
}

export default function MarkdownEditor({
  value,
  onChange,
  isEditing: externalIsEditing,
}: MarkdownEditorProps) {
  const [isEditing, setIsEditing] = useState(externalIsEditing);
  const [isHovered, setIsHovered] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        editorRef.current &&
        !editorRef.current.contains(e.target as Node)
      ) {
        setIsEditing(false);
      }
    },
    [],
  );

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsEditing(false);
    }
  }, []);

  useEffect(() => {
    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isEditing, handleClickOutside, handleEscape]);

  useEffect(() => {
    setIsEditing(externalIsEditing);
  }, [externalIsEditing]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[var(--muted-foreground)]">
        Description
      </label>

      <div ref={editorRef} data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}>
        {isEditing ? (
          <MDEditor
            value={value}
            onChange={(val) => onChange(val ?? "")}
            height={320}
            preview="edit"
          />
        ) : (
          <div
            className="group relative cursor-pointer"
            onClick={() => setIsEditing(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {isHovered && (
              <button
                type="button"
                className="absolute right-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-md bg-[var(--secondary)] px-2.5 py-1 text-xs font-medium text-[var(--secondary-foreground)] shadow-sm transition-colors"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}

            <div
              className="min-h-[80px] rounded-md border border-[var(--border)] p-3 text-sm transition-colors hover:border-[var(--foreground)]/30"
            >
              {value ? (
                <MDPreview source={value} style={{ background: "transparent" }} />
              ) : (
                <p className="text-[var(--muted-foreground)]">
                  Click to add a description...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
