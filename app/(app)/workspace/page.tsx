"use client";

import { useWorkspaces, useCreateWorkspace } from "@/lib/hooks/usePages";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function WorkspaceIndexPage() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const router = useRouter();
  const creating = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (workspaces && workspaces.length > 0) {
      router.replace(`/workspace/${workspaces[0].id}`);
    } else if (!creating.current) {
      creating.current = true;
      createWorkspace.mutate(
        { name: "My Workspace" },
        {
          onSuccess: (ws) => {
            router.replace(`/workspace/${ws.id}`);
          },
        }
      );
    }
  }, [workspaces, isLoading, router, createWorkspace]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--muted)] border-t-[var(--primary)] mx-auto mb-4" />
        <p className="text-sm text-[var(--muted-foreground)]">
          Setting up your workspace...
        </p>
      </div>
    </div>
  );
}
