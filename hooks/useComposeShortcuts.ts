"use client";

import { useEffect, useRef } from "react";

type ComposeAction = "reply" | "reply_all" | "forward";

interface ComposeShortcutCallbacks {
  onAction: (action: ComposeAction, aiMode: boolean) => void;
  onClose: () => void;
  /** Whether a compose pane is currently open */
  isOpen: boolean;
}

/**
 * Keyboard shortcut hook for email compose actions.
 *
 * Command mode (compose fields NOT focused):
 * - R: Reply
 * - A: Reply All
 * - F: Forward
 * - Shift+R: Reply with AI
 * - Shift+A: Reply All with AI
 * - Shift+F: Forward with AI
 * - Escape: Close compose pane
 *
 * Always active:
 * - Cmd/Ctrl+Enter: Handled by ComposePane directly
 * - Escape: Close compose pane (handled by ComposePane with blur-first logic)
 */
export function useComposeShortcuts({
  onAction,
  onClose,
  isOpen,
}: ComposeShortcutCallbacks) {
  const callbacksRef = useRef({ onAction, onClose, isOpen });
  callbacksRef.current = { onAction, onClose, isOpen };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const { onAction, onClose, isOpen } = callbacksRef.current;

      // Check if we're in "insert mode" (compose field focused)
      const active = document.activeElement;
      const isComposeField =
        active?.hasAttribute("data-compose-field") ||
        active?.closest("[data-compose-pane]") !== null;

      // Command mode shortcuts — only when compose fields are NOT focused
      if (!isComposeField && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const key = e.key.toLowerCase();

        if (key === "r" && !e.shiftKey) {
          e.preventDefault();
          onAction("reply", false);
          return;
        }
        if (key === "a" && !e.shiftKey) {
          e.preventDefault();
          onAction("reply_all", false);
          return;
        }
        if (key === "f" && !e.shiftKey) {
          e.preventDefault();
          onAction("forward", false);
          return;
        }
        if (key === "r" && e.shiftKey) {
          e.preventDefault();
          onAction("reply", true);
          return;
        }
        if (key === "a" && e.shiftKey) {
          e.preventDefault();
          onAction("reply_all", true);
          return;
        }
        if (key === "f" && e.shiftKey) {
          e.preventDefault();
          onAction("forward", true);
          return;
        }
        if (key === "escape" && isOpen) {
          e.preventDefault();
          onClose();
          return;
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
