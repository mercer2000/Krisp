"use client";

import { use } from "react";
import { usePage } from "@/lib/hooks/usePages";
import { PageHeader } from "@/components/pages/PageHeader";
import { BlockEditor } from "@/components/pages/editor/BlockEditor";
import { DatabaseView } from "@/components/pages/database/DatabaseView";

export default function PageView({
  params,
}: {
  params: Promise<{ workspaceId: string; pageId: string }>;
}) {
  const { workspaceId, pageId } = use(params);
  const { data: page, isLoading } = usePage(pageId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-16 py-12">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-64 rounded bg-[var(--muted)]" />
          <div className="h-5 w-full rounded bg-[var(--muted)]" />
          <div className="h-5 w-3/4 rounded bg-[var(--muted)]" />
          <div className="h-5 w-1/2 rounded bg-[var(--muted)]" />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[var(--muted-foreground)]">Page not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-16 py-12">
      <PageHeader page={page} />
      {page.isDatabase ? (
        <DatabaseView page={page} />
      ) : (
        <BlockEditor page={page} />
      )}
    </div>
  );
}
