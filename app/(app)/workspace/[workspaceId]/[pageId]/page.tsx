"use client";

import { use, useState } from "react";
import { usePage, usePageEntries } from "@/lib/hooks/usePages";
import { PageHeader } from "@/components/pages/PageHeader";
import { BlockEditor } from "@/components/pages/editor/BlockEditor";
import { DatabaseView } from "@/components/pages/database/DatabaseView";
import { PageTabs, type PageTab } from "@/components/pages/PageTabs";
import { KnowledgeTab } from "@/components/pages/tabs/KnowledgeTab";
import { DecisionsTab } from "@/components/pages/tabs/DecisionsTab";
import { SmartRulesTab } from "@/components/pages/tabs/SmartRulesTab";
import { ActivityTab } from "@/components/pages/tabs/ActivityTab";
import { PageAskBar } from "@/components/pages/PageAskBar";

export default function PageView({
  params,
}: {
  params: Promise<{ workspaceId: string; pageId: string }>;
}) {
  const { workspaceId, pageId } = use(params);
  const { data: page, isLoading } = usePage(pageId);
  const [activeTab, setActiveTab] = useState<PageTab>("notes");

  // Fetch entry counts for tab badges
  const { data: knowledgeData } = usePageEntries(page?.id, "knowledge");
  const { data: emailData } = usePageEntries(page?.id, "email_summary");
  const { data: decisionData } = usePageEntries(page?.id, "decision");

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

  const knowledgeCount = (knowledgeData?.total ?? 0) + (emailData?.total ?? 0);
  const decisionsCount = decisionData?.total ?? 0;

  // Database pages keep their existing layout (no tabs)
  if (page.isDatabase) {
    return (
      <div className="mx-auto max-w-3xl px-16 py-12">
        <PageHeader page={page} />
        <DatabaseView page={page} />
        <PageAskBar pageId={page.id} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-16 py-12">
      <PageHeader page={page} />
      <PageTabs
        page={page}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        entryCounts={{ knowledge: knowledgeCount, decisions: decisionsCount }}
      />

      {activeTab === "notes" && <BlockEditor page={page} />}
      {activeTab === "knowledge" && <KnowledgeTab page={page} />}
      {activeTab === "decisions" && <DecisionsTab page={page} />}
      {activeTab === "smart-rules" && <SmartRulesTab page={page} />}
      {activeTab === "activity" && <ActivityTab page={page} />}

      <PageAskBar pageId={page.id} />
    </div>
  );
}
