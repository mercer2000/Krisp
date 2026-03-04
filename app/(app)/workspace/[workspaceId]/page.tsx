"use client";

import { use } from "react";
import { usePages } from "@/lib/hooks/usePages";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const { data: pages } = usePages(workspaceId);
  const router = useRouter();

  useEffect(() => {
    if (pages && pages.length > 0) {
      const firstPage = pages.find((p) => !p.parentId && !p.isArchived);
      if (firstPage) {
        router.replace(`/workspace/${workspaceId}/${firstPage.id}`);
      }
    }
  }, [pages, workspaceId, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">📝</div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          No pages yet
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Create your first page from the sidebar
        </p>
      </div>
    </div>
  );
}
