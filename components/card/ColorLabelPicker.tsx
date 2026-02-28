"use client";

import { Check, X } from "lucide-react";

const PRESET_COLORS = [
  null,
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

interface ColorLabelPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
}

export default function ColorLabelPicker({
  value,
  onChange,
}: ColorLabelPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        Color Label
      </label>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color ?? "none"}
            type="button"
            onClick={() => onChange(color)}
            className={`
              relative flex h-8 w-8 items-center justify-center rounded-full
              border-2 transition-all hover:scale-110
              ${
                value === color
                  ? "border-foreground ring-2 ring-foreground/20"
                  : "border-transparent hover:border-muted-foreground/40"
              }
            `}
            style={{
              backgroundColor: color ?? "var(--card)",
            }}
            title={color ?? "None"}
          >
            {value === color && color !== null && (
              <Check className="h-4 w-4 text-white drop-shadow-sm" />
            )}
            {value === color && color === null && (
              <Check className="h-4 w-4 text-foreground" />
            )}
            {color === null && value !== color && (
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
