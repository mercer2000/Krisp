"use client";

import { use } from "react";
import { PagesSidebar } from "@/components/pages/PagesSidebar";
import { QuickFind, useQuickFind } from "@/components/pages/QuickFind";

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const quickFind = useQuickFind();

  return (
    <div className="flex h-full">
      <PagesSidebar workspaceId={workspaceId} />
      <div className="flex-1 overflow-auto">{children}</div>
      <QuickFind
        workspaceId={workspaceId}
        open={quickFind.open}
        onClose={() => quickFind.setOpen(false)}
      />
    </div>
  );
}
