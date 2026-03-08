"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SideNav } from "./SideNav";
import { MobileBottomNav } from "./MobileBottomNav";
import { ToastProvider } from "./Toast";
import { CommandPalette } from "./CommandPalette";
import { AIUsageWidget } from "../ai/AIUsageWidget";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B / Cmd+B → open Brain
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        router.push("/brain");
      }
      // Ctrl+K / Cmd+K → toggle command palette
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
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

      {/* Mobile bottom navigation */}
      <MobileBottomNav />

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </ToastProvider>
  );
}
