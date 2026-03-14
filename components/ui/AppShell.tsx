"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { SideNav } from "./SideNav";
import { MobileBottomNav } from "./MobileBottomNav";
import { ToastProvider } from "./Toast";
import { CommandPalette } from "./CommandPalette";
import { ShortcutReferenceSheet } from "./ShortcutReferenceSheet";
import { AIUsageWidget } from "../ai/AIUsageWidget";
import { TrialBanner } from "./TrialBanner";
import { OutlookReconnectBanner } from "./OutlookReconnectBanner";
import {
  useKeyboardShortcuts,
  type ShortcutHandler,
} from "@/lib/hooks/useKeyboardShortcuts";
import { SHORTCUT_REGISTRY } from "@/lib/shortcuts/registry";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutSheetOpen, setShortcutSheetOpen] = useState(false);

  // Theme cycle callback
  const cycleTheme = useCallback(() => {
    const CYCLE = ["system", "light", "dark"] as const;
    const current = theme ?? "system";
    const idx = CYCLE.indexOf(current as (typeof CYCLE)[number]);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setTheme(next);
  }, [theme, setTheme]);

  // Callback dispatch for non-navigation shortcuts
  const handleCallback = useCallback(
    (id: string) => {
      switch (id) {
        case "shortcut-reference":
          setShortcutSheetOpen(true);
          break;
        case "toggle-theme":
          cycleTheme();
          break;
        case "brain-capture":
          router.push("/brain");
          break;
        case "kanban-new-card":
          router.push("/boards");
          break;
        case "kanban-search":
          // Only meaningful on a board page — no-op otherwise
          break;
      }
    },
    [cycleTheme, router],
  );

  // Build shortcut handlers from registry
  const shortcuts: ShortcutHandler[] = useMemo(() => {
    const handlers: ShortcutHandler[] = [];

    for (const entry of SHORTCUT_REGISTRY) {
      if (entry.keys.length === 0) continue;

      for (const keyCombo of entry.keys) {
        if (entry.isPaletteToggle) {
          handlers.push({
            keys: keyCombo,
            handler: () => setCommandPaletteOpen((prev) => !prev),
          });
        } else if (entry.action.type === "navigate") {
          const href = entry.action.href;
          handlers.push({
            keys: keyCombo,
            handler: () => router.push(href),
          });
        } else if (entry.action.type === "callback") {
          const id = entry.action.id;
          handlers.push({
            keys: keyCombo,
            handler: () => handleCallback(id),
          });
        }
      }
    }

    return handlers;
  }, [router, handleCallback]);

  useKeyboardShortcuts(shortcuts);

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen">
      <TrialBanner />
      <OutlookReconnectBanner />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:block">
          <SideNav />
        </div>

        {/* Main content — bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-auto relative pb-16 md:pb-0">
          <div className="hidden md:block absolute top-3 right-4 z-40">
            <AIUsageWidget />
          </div>
          {children}
        </main>
      </div>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenShortcutSheet={() => setShortcutSheetOpen(true)}
      />

      <ShortcutReferenceSheet
        open={shortcutSheetOpen}
        onClose={() => setShortcutSheetOpen(false)}
      />
    </ToastProvider>
  );
}
