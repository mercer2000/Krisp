"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SideNav } from "./SideNav";
import { ToastProvider } from "./Toast";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Global keyboard shortcut: Ctrl+B / Cmd+B → open Brain
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        router.push("/brain");
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
    </ToastProvider>
  );
}
