"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SideNav } from "./SideNav";
import { ToastProvider } from "./Toast";
import { CommandPalette } from "./CommandPalette";

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
        <SideNav />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </ToastProvider>
  );
}
