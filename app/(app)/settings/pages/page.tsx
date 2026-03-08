"use client";

import Link from "next/link";
import { useWorkspaces } from "@/lib/hooks/usePages";

export default function SettingsPagesPage() {
  const { data: workspaces, isLoading } = useWorkspaces();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold text-[var(--foreground)]">
        Pages
      </h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">
        Manage your workspaces and pages.
      </p>

      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">
            Workspaces
          </h2>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--muted)] border-t-[var(--primary)]" />
              Loading...
            </div>
          ) : workspaces && workspaces.length > 0 ? (
            <ul className="space-y-2">
              {workspaces.map((ws) => (
                <li key={ws.id}>
                  <Link
                    href={`/workspace/${ws.id}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3 transition-colors hover:bg-[var(--accent)]"
                  >
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {ws.name}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Open &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              No workspaces found. Visit{" "}
              <Link href="/workspace" className="text-[var(--primary)] hover:underline">
                Pages
              </Link>{" "}
              to create your first workspace.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
