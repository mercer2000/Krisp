"use client";

import { useState, useCallback, useMemo } from "react";
import { usePages, useCreatePage, useUpdatePage, useReorderPages } from "@/lib/hooks/usePages";
import { useRouter, useParams } from "next/navigation";
import { NewPageSetupModal } from "@/components/pages/NewPageSetupModal";
import { SmartRuleGuideModal } from "@/components/pages/SmartRuleGuideModal";
import type { Page } from "@/types";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

function GripIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="5" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="19" r="1" />
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

function getPageIcon(page: Page) {
  return page.icon || (page.pageType === "knowledge" ? "\u{1F9E0}" : page.pageType === "decisions" ? "\u2696\uFE0F" : page.isDatabase ? "\u{1F4CA}" : "\u{1F4C4}");
}

// ── Sortable page item ──────────────────────────────────────────────────────

interface SortablePageItemProps {
  page: Page;
  pages: Page[];
  level: number;
  workspaceId: string;
  activePageId: string | undefined;
  onNavigate: (pageId: string) => void;
  isDragOverlay?: boolean;
}

function SortablePageItem({ page, pages, level, workspaceId, activePageId, onNavigate, isDragOverlay }: SortablePageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    data: { type: "page", page },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging && !isDragOverlay ? "opacity-30" : ""}
    >
      <PageTreeItem
        page={page}
        pages={pages}
        level={level}
        workspaceId={workspaceId}
        activePageId={activePageId}
        onNavigate={onNavigate}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragOverlay={isDragOverlay}
      />
    </div>
  );
}

// ── Static page item (for drag overlay & children) ──────────────────────────

interface PageTreeItemProps {
  page: Page;
  pages: Page[];
  level: number;
  workspaceId: string;
  activePageId: string | undefined;
  onNavigate: (pageId: string) => void;
  dragHandleProps?: Record<string, unknown>;
  isDragOverlay?: boolean;
}

function PageTreeItem({ page, pages, level, workspaceId, activePageId, onNavigate, dragHandleProps, isDragOverlay }: PageTreeItemProps) {
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
        } ${isDragOverlay ? "bg-[var(--card)] border border-[var(--border)] shadow-lg rounded-md" : ""}`}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={() => onNavigate(page.id)}
      >
        {/* Drag handle */}
        <button
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-[var(--accent)] cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          {...(dragHandleProps || {})}
        >
          <GripIcon size={12} />
        </button>
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
          {getPageIcon(page)}
        </span>
        <span className="flex-1 truncate">
          {page.title || "Untitled"}
        </span>
        {(page.entryCount ?? 0) > 0 && (
          <span className="shrink-0 ml-auto mr-1 text-[10px] leading-none font-medium text-[var(--muted-foreground)] opacity-60 group-hover:hidden">
            ({page.entryCount})
          </span>
        )}
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

// ── Main sidebar ─────────────────────────────────────────────────────────────

export function PagesSidebar({ workspaceId }: { workspaceId: string }) {
  const { data: pages, isLoading } = usePages(workspaceId);
  const createPage = useCreatePage();
  const reorderPages = useReorderPages(workspaceId);
  const router = useRouter();
  const routeParams = useParams();
  const activePageId = routeParams?.pageId as string | undefined;
  const [showTrash, setShowTrash] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [setupModal, setSetupModal] = useState<{ open: boolean; pageId: string; pageName: string }>({
    open: false,
    pageId: "",
    pageName: "",
  });

  const rootPages = useMemo(
    () =>
      (pages || [])
        .filter((p) => !p.parentId && !p.isArchived)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [pages],
  );

  const rootPageIds = useMemo(() => rootPages.map((p) => p.id), [rootPages]);

  const archivedPages = (pages || []).filter((p) => p.isArchived);

  const activeDragPage = activeDragId
    ? (pages || []).find((p) => p.id === activeDragId)
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const handleNavigate = useCallback(
    (pageId: string) => {
      router.push(`/workspace/${workspaceId}/${pageId}`);
    },
    [router, workspaceId]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = rootPages.findIndex((p) => p.id === active.id);
      const newIndex = rootPages.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(rootPages, oldIndex, newIndex);
      const updates = reordered.map((p, i) => ({
        id: p.id,
        sort_order: i,
      }));

      reorderPages.mutate({ pages: updates });
    },
    [rootPages, reorderPages],
  );

  const handleNewPage = () => {
    createPage.mutate(
      { workspace_id: workspaceId, title: "", page_type: "page" },
      {
        onSuccess: (page) => {
          handleNavigate(page.id);
          setSetupModal({ open: true, pageId: page.id, pageName: "" });
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={rootPageIds} strategy={verticalListSortingStrategy}>
            {rootPages.map((page) => (
              <SortablePageItem
                key={page.id}
                page={page}
                pages={pages || []}
                level={0}
                workspaceId={workspaceId}
                activePageId={activePageId}
                onNavigate={handleNavigate}
              />
            ))}
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeDragPage ? (
              <PageTreeItem
                page={activeDragPage}
                pages={pages || []}
                level={0}
                workspaceId={workspaceId}
                activePageId={activePageId}
                onNavigate={() => {}}
                isDragOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Bottom actions */}
      <div className="border-t border-[var(--border)] p-2 space-y-1">
        <button
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          onClick={handleNewPage}
        >
          <PlusIcon size={16} />
          New Page
        </button>
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

      {/* New page setup modal */}
      {setupModal.pageId && (
        <NewPageSetupModal
          open={setupModal.open}
          onClose={() => setSetupModal((s) => ({ ...s, open: false }))}
          pageId={setupModal.pageId}
          pageName={setupModal.pageName}
          onPageNameChange={(name) => setSetupModal((s) => ({ ...s, pageName: name }))}
        />
      )}

      {/* Smart rule feature guide (shows until first rule is created) */}
      <SmartRuleGuideModal onCreatePage={handleNewPage} />
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
        {page.icon || "\u{1F4C4}"}
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
