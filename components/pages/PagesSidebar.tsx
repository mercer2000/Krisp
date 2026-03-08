"use client";

import { useState, useCallback } from "react";
import { usePages, useCreatePage, useUpdatePage } from "@/lib/hooks/usePages";
import { useRouter, useParams } from "next/navigation";
import type { Page } from "@/types";

function ChevronIcon({ expanded, size = 16 }: { expanded: boolean; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MoreIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

interface PageTreeItemProps {
  page: Page;
  pages: Page[];
  level: number;
  workspaceId: string;
  activePageId: string | undefined;
  onNavigate: (pageId: string) => void;
}

function PageTreeItem({ page, pages, level, workspaceId, activePageId, onNavigate }: PageTreeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const children = pages.filter((p) => p.parentId === page.id && !p.isArchived);
  const hasChildren = children.length > 0;
  const isActive = activePageId === page.id;
  const createPage = useCreatePage();
  const updatePage = useUpdatePage(page.id);

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    createPage.mutate(
      { workspace_id: workspaceId, parent_id: page.id, title: "" },
      {
        onSuccess: (newPage) => {
          setExpanded(true);
          onNavigate(newPage.id);
        },
      }
    );
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    updatePage.mutate({ is_archived: true });
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-0.5 rounded-md px-1 py-1 text-sm cursor-pointer transition-colors ${
          isActive
            ? "bg-[var(--primary)]/10 text-[var(--primary)]"
            : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
        }`}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={() => onNavigate(page.id)}
      >
        <button
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-60 hover:opacity-100 hover:bg-[var(--accent)]"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {hasChildren ? <ChevronIcon expanded={expanded} size={14} /> : <span className="w-3.5" />}
        </button>
        {page.color && (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: page.color }}
          />
        )}
        <span className="shrink-0 text-base leading-none mr-1">
          {page.icon || (page.pageType === "knowledge" ? "🧠" : page.pageType === "decisions" ? "⚖️" : page.isDatabase ? "📊" : "📄")}
        </span>
        <span className="flex-1 truncate">
          {page.title || "Untitled"}
        </span>
        <div className="hidden items-center gap-0.5 group-hover:flex">
          <button
            className="flex h-5 w-5 items-center justify-center rounded opacity-60 hover:opacity-100 hover:bg-[var(--accent)]"
            onClick={handleAddChild}
            title="Add sub-page"
          >
            <PlusIcon size={14} />
          </button>
          <div className="relative">
            <button
              className="flex h-5 w-5 items-center justify-center rounded opacity-60 hover:opacity-100 hover:bg-[var(--accent)]"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              title="More options"
            >
              <MoreIcon size={14} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-6 z-50 min-w-[140px] rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg">
                  <button
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--destructive)] hover:bg-[var(--accent)]"
                    onClick={handleArchive}
                  >
                    <TrashIcon size={14} />
                    Archive
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {expanded && hasChildren && (
        <div>
          {children
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((child) => (
              <PageTreeItem
                key={child.id}
                page={child}
                pages={pages}
                level={level + 1}
                workspaceId={workspaceId}
                activePageId={activePageId}
                onNavigate={onNavigate}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function PagesSidebar({ workspaceId }: { workspaceId: string }) {
  const { data: pages } = usePages(workspaceId);
  const createPage = useCreatePage();
  const router = useRouter();
  const routeParams = useParams();
  const activePageId = routeParams?.pageId as string | undefined;
  const [showTrash, setShowTrash] = useState(false);

  const rootPages = (pages || [])
    .filter((p) => !p.parentId && !p.isArchived)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const archivedPages = (pages || []).filter((p) => p.isArchived);

  const handleNavigate = useCallback(
    (pageId: string) => {
      router.push(`/workspace/${workspaceId}/${pageId}`);
    },
    [router, workspaceId]
  );

  const [showNewPageMenu, setShowNewPageMenu] = useState(false);

  const handleNewPage = (pageType: "page" | "knowledge" | "decisions" = "page") => {
    const defaults: Record<string, { title: string; icon: string }> = {
      page: { title: "", icon: "" },
      knowledge: { title: "Knowledge", icon: "🧠" },
      decisions: { title: "Decisions", icon: "⚖️" },
    };
    const d = defaults[pageType];
    createPage.mutate(
      { workspace_id: workspaceId, title: d.title, icon: d.icon || undefined, page_type: pageType },
      {
        onSuccess: (page) => {
          handleNavigate(page.id);
          setShowNewPageMenu(false);
        },
      }
    );
  };

  return (
    <div className="flex h-full w-[240px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)]">
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-[var(--border)] px-3">
        <span className="text-sm font-semibold text-[var(--foreground)]">Pages</span>
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          onClick={() => router.push(`/workspace/${workspaceId}`)}
          title="Search (Cmd+K)"
        >
          <SearchIcon size={14} />
        </button>
      </div>

      {/* Page tree */}
      <div className="flex-1 overflow-auto px-1 py-1">
        {rootPages.map((page) => (
          <PageTreeItem
            key={page.id}
            page={page}
            pages={pages || []}
            level={0}
            workspaceId={workspaceId}
            activePageId={activePageId}
            onNavigate={handleNavigate}
          />
        ))}
      </div>

      {/* Bottom actions */}
      <div className="border-t border-[var(--border)] p-2 space-y-1">
        <div className="relative">
          <button
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            onClick={() => setShowNewPageMenu(!showNewPageMenu)}
          >
            <PlusIcon size={16} />
            New Page
          </button>
          {showNewPageMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNewPageMenu(false)} />
              <div className="absolute bottom-full left-0 mb-1 z-50 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg">
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--accent)]"
                  onClick={() => handleNewPage("page")}
                >
                  📄 Blank Page
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--accent)]"
                  onClick={() => handleNewPage("knowledge")}
                >
                  🧠 Knowledge Page
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--accent)]"
                  onClick={() => handleNewPage("decisions")}
                >
                  ⚖️ Decisions Page
                </button>
              </div>
            </>
          )}
        </div>
        <button
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          onClick={() => setShowTrash(!showTrash)}
        >
          <TrashIcon size={16} />
          Trash
          {archivedPages.length > 0 && (
            <span className="ml-auto text-xs opacity-60">{archivedPages.length}</span>
          )}
        </button>
      </div>

      {/* Trash dropdown */}
      {showTrash && archivedPages.length > 0 && (
        <div className="border-t border-[var(--border)] max-h-48 overflow-auto px-1 py-1">
          {archivedPages.map((page) => (
            <TrashItem key={page.id} page={page} workspaceId={workspaceId} />
          ))}
        </div>
      )}
    </div>
  );
}

function TrashItem({ page, workspaceId }: { page: Page; workspaceId: string }) {
  const updatePage = useUpdatePage(page.id);

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    updatePage.mutate({ is_archived: false });
  };

  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--muted-foreground)]">
      <span className="shrink-0 text-base leading-none">
        {page.icon || "📄"}
      </span>
      <span className="flex-1 truncate">{page.title || "Untitled"}</span>
      <button
        className="text-xs text-[var(--primary)] hover:underline"
        onClick={handleRestore}
      >
        Restore
      </button>
    </div>
  );
}
