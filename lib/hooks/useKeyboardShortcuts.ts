"use client";

import { useEffect, useRef } from "react";
import { isNativeMobile } from "@/lib/mobile/platform";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShortcutHandler {
  /** Key combo string: "Mod+K", "Shift+/", or sequence like "G D" */
  keys: string;
  handler: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** True when focus is inside an editable element where shortcuts should not fire */
function isEditableTarget(e: Event): boolean {
  const target = e.target as HTMLElement | null;
  if (!target) return false;
  if (INPUT_TAGS.has(target.tagName)) return true;
  if (target.isContentEditable) return true;
  // Markdown editor (@uiw/react-md-editor) wraps a textarea in .w-md-editor
  if (target.closest?.(".w-md-editor")) return true;
  return false;
}

const IS_MAC =
  typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/** Normalise a single key combo like "Mod+Shift+K" into a canonical form */
function normaliseCombo(combo: string): string {
  const parts = combo.split("+").map((p) => p.trim().toLowerCase());
  // Replace "mod" with platform key
  const out: string[] = [];
  let ctrl = false;
  let meta = false;
  let shift = false;
  let alt = false;
  let key = "";

  for (const p of parts) {
    if (p === "mod") {
      if (IS_MAC) meta = true;
      else ctrl = true;
    } else if (p === "ctrl") ctrl = true;
    else if (p === "meta" || p === "cmd") meta = true;
    else if (p === "shift") shift = true;
    else if (p === "alt" || p === "option") alt = true;
    else key = p;
  }

  if (ctrl) out.push("ctrl");
  if (meta) out.push("meta");
  if (shift) out.push("shift");
  if (alt) out.push("alt");
  out.push(key);
  return out.join("+");
}

/** Map from shifted character to the base key (US layout) */
const SHIFT_KEY_MAP: Record<string, string> = {
  "?": "/",
  "!": "1",
  "@": "2",
  "#": "3",
  "$": "4",
  "%": "5",
  "^": "6",
  "&": "7",
  "*": "8",
  "(": "9",
  ")": "0",
  "+": "=",
  "{": "[",
  "}": "]",
  "|": "\\",
  ":": ";",
  '"': "'",
  "<": ",",
  ">": ".",
  "~": "`",
  _: "-",
};

/** Build the canonical combo string from a live KeyboardEvent */
function eventToCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("ctrl");
  if (e.metaKey) parts.push("meta");
  if (e.shiftKey) parts.push("shift");
  if (e.altKey) parts.push("alt");
  // When shift produces a different char (e.g. ? from /), map back to base key
  const key = e.key.toLowerCase();
  const baseKey = e.shiftKey ? SHIFT_KEY_MAP[e.key] ?? key : key;
  parts.push(baseKey);
  return parts.join("+");
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Global keyboard shortcut listener.
 *
 * Supports:
 * - Single combos: "Mod+K", "Shift+/", "Escape"
 * - Two-key sequences: "G D" (press G, then within 800ms press D)
 *
 * Automatically suppresses when focus is in inputs/textareas/contentEditable.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  // We keep shortcuts in a ref so we don't re-attach on every render
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  // Track sequence state: first key pressed + timestamp
  const seqRef = useRef<{ key: string; time: number } | null>(null);

  useEffect(() => {
    // Keyboard shortcuts are irrelevant on native mobile (no physical keyboard)
    if (isNativeMobile()) return;
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire in editable contexts
      if (isEditableTarget(e)) return;

      const combo = eventToCombo(e);

      for (const sc of shortcutsRef.current) {
        const keyStr = sc.keys;

        // Check for two-key sequences (e.g. "G D")
        if (keyStr.includes(" ")) {
          const [first, second] = keyStr.split(" ").map((s) => s.trim().toLowerCase());
          const seq = seqRef.current;

          // If we have no modifier keys and this is the first key
          if (
            !e.ctrlKey &&
            !e.metaKey &&
            !e.shiftKey &&
            !e.altKey &&
            e.key.toLowerCase() === first &&
            (!seq || seq.key !== first)
          ) {
            seqRef.current = { key: first, time: Date.now() };
            return; // wait for second key
          }

          // Check if second key matches within timeout
          if (
            seq &&
            seq.key === first &&
            Date.now() - seq.time < 800 &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.shiftKey &&
            !e.altKey &&
            e.key.toLowerCase() === second
          ) {
            e.preventDefault();
            seqRef.current = null;
            sc.handler();
            return;
          }
          continue;
        }

        // Single combo
        const norm = normaliseCombo(keyStr);
        if (combo === norm) {
          e.preventDefault();
          seqRef.current = null;
          sc.handler();
          return;
        }
      }

      // Clear stale sequence if no second key matched
      if (seqRef.current && Date.now() - seqRef.current.time >= 800) {
        seqRef.current = null;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

/**
 * Detect if user is on macOS (for display purposes).
 * Must be called on the client.
 */
export function useIsMac(): boolean {
  return IS_MAC;
}
