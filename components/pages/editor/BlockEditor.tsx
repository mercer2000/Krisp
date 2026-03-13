"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useCreateBlock,
  useUpdateBlock,
  useDeleteBlock,
  useReorderBlocks,
} from "@/lib/hooks/useBlocks";
import { saveDraft, readDrafts, hasDrafts, clearDrafts } from "@/lib/cache/pagesCache";
import type { PageWithBlocks, Block, BlockType } from "@/types";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { BlockActionMenu } from "./BlockActionMenu";

interface BlockEditorProps {
  page: PageWithBlocks;
}

// Sort blocks by sortOrder, filtering to top-level only
function getRootBlocks(blocks: Block[]): Block[] {
  return blocks
    .filter((b) => !b.parentBlockId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

const BLOCK_PLACEHOLDER: Record<string, string> = {
  paragraph: "Type '/' for commands...",
  heading_1: "Heading 1",
  heading_2: "Heading 2",
  heading_3: "Heading 3",
  bulleted_list: "List item",
  numbered_list: "List item",
  to_do: "To-do",
  quote: "Quote",
  code: "Code",
  callout: "Callout",
  toggle: "Toggle",
};

const BLOCK_STYLES: Record<string, string> = {
  paragraph: "text-base",
  heading_1: "text-3xl font-bold",
  heading_2: "text-2xl font-semibold",
  heading_3: "text-xl font-semibold",
  bulleted_list: "text-base",
  numbered_list: "text-base",
  to_do: "text-base",
  quote: "text-base italic border-l-4 border-[var(--muted-foreground)]/30 pl-4",
  code: "font-mono text-sm bg-[var(--muted)] rounded-md p-3",
  callout: "text-base bg-[var(--muted)] rounded-md p-3",
  toggle: "text-base",
  divider: "",
  image: "",
  bookmark: "",
};

// Markdown shortcuts map
const MARKDOWN_SHORTCUTS: Record<string, BlockType> = {
  "# ": "heading_1",
  "## ": "heading_2",
  "### ": "heading_3",
  "- ": "bulleted_list",
  "* ": "bulleted_list",
  "1. ": "numbered_list",
  "[] ": "to_do",
  "[ ] ": "to_do",
  "> ": "quote",
  "---": "divider",
};

export function BlockEditor({ page }: BlockEditorProps) {
  const blocks = getRootBlocks(page.blocks);
  const createBlock = useCreateBlock(page.id);
  const updateBlock = useUpdateBlock(page.id);
  const deleteBlock = useDeleteBlock(page.id);
  const reorderBlocks = useReorderBlocks(page.id);
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const [actionMenuBlockId, setActionMenuBlockId] = useState<string | null>(null);
  const [actionMenuPos, setActionMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [slashMenu, setSlashMenu] = useState<{
    blockId: string;
    position: { top: number; left: number };
    filter: string;
  } | null>(null);
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // dnd-kit sensors — require 5px movement before activating drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // Focus a block's editable element
  const focusBlock = useCallback((blockId: string, atEnd = false) => {
    requestAnimationFrame(() => {
      const el = blockRefs.current.get(blockId);
      if (!el) return;
      el.focus();
      if (atEnd) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    });
  }, []);

  // Set focus when focusBlockId changes
  useEffect(() => {
    if (focusBlockId) {
      focusBlock(focusBlockId, true);
      setFocusBlockId(null);
    }
  }, [focusBlockId, focusBlock]);

  // Clear selection when clicking outside blocks
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-block-wrapper]")) {
        setSelectedBlockIds(new Set());
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global keyboard handler for bulk delete of selected blocks
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (selectedBlockIds.size <= 1) return;
      if (e.key === "Backspace" || e.key === "Delete") {
        // Don't intercept if user is typing in a contentEditable
        const active = document.activeElement;
        if (active && (active as HTMLElement).isContentEditable) return;

        e.preventDefault();
        for (const id of selectedBlockIds) {
          deleteBlock.mutate(id);
        }
        setSelectedBlockIds(new Set());
      }
      if (e.key === "Escape") {
        setSelectedBlockIds(new Set());
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [selectedBlockIds, deleteBlock]);

  // Recover unsaved drafts on mount
  const [draftRecovered, setDraftRecovered] = useState(false);
  const [draftRecoveryDone, setDraftRecoveryDone] = useState(false);
  useEffect(() => {
    if (draftRecoveryDone) return;
    const drafts = readDrafts(page.id);
    if (drafts && Object.keys(drafts).length > 0) {
      // Apply any drafts that are newer than the server data
      let applied = false;
      for (const [blockId, draft] of Object.entries(drafts)) {
        const el = blockRefs.current.get(blockId);
        if (el && draft.content?.text !== undefined) {
          el.innerHTML = draft.content.text as string;
          applied = true;
        }
      }
      if (applied) {
        setDraftRecovered(true);
        // Auto-dismiss recovery banner after 4 seconds
        setTimeout(() => setDraftRecovered(false), 4000);
        // Re-save recovered drafts to server
        for (const [blockId, draft] of Object.entries(drafts)) {
          if (draft.content) {
            updateBlock.mutate({ blockId, content: draft.content, _skipInvalidate: true });
          }
        }
      }
    }
    setDraftRecoveryDone(true);
  }, [draftRecoveryDone, page.id, updateBlock, blockRefs]);

  // Warn before navigating away with pending debounce timers
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (debounceTimers.current.size > 0) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Debounced content save — also saves draft to localStorage immediately
  const saveBlockContent = useCallback(
    (blockId: string, content: Record<string, unknown>) => {
      // Save to localStorage immediately so edits survive refresh
      saveDraft(page.id, { blockId, content });

      const existing = debounceTimers.current.get(blockId);
      if (existing) clearTimeout(existing);
      debounceTimers.current.set(
        blockId,
        setTimeout(() => {
          updateBlock.mutate({ blockId, content, _skipInvalidate: true });
          debounceTimers.current.delete(blockId);
        }, 500)
      );
    },
    [updateBlock, page.id]
  );

  const handleCreateBlock = useCallback(
    (afterIndex: number, type: BlockType = "paragraph", content: Record<string, unknown> = { text: "" }) => {
      createBlock.mutate(
        {
          type,
          content,
          sort_order: (afterIndex + 1) * 1000,
        },
        {
          onSuccess: (newBlock) => {
            setFocusBlockId(newBlock.id);
          },
        }
      );
    },
    [createBlock]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, block: Block, index: number) => {
      const el = e.currentTarget as HTMLElement;
      const text = el.textContent || "";

      if (e.key === "Enter" && !e.shiftKey) {
        if (slashMenu && slashMenu.blockId === block.id) {
          return;
        }
        e.preventDefault();
        handleCreateBlock(index);
        return;
      }

      if (e.key === "Backspace" && text === "") {
        e.preventDefault();
        if (blocks.length > 1) {
          deleteBlock.mutate(block.id);
          if (index > 0) {
            setFocusBlockId(blocks[index - 1].id);
          }
        } else if (block.type !== "paragraph") {
          updateBlock.mutate({
            blockId: block.id,
            type: "paragraph",
            content: { text: "" },
          });
        }
        return;
      }

      if (e.key === "ArrowUp") {
        const sel = window.getSelection();
        if (sel && sel.anchorOffset === 0 && index > 0) {
          e.preventDefault();
          focusBlock(blocks[index - 1].id, true);
        }
        return;
      }

      if (e.key === "ArrowDown") {
        const sel = window.getSelection();
        if (sel && sel.anchorOffset === text.length && index < blocks.length - 1) {
          e.preventDefault();
          focusBlock(blocks[index + 1].id, false);
        }
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        return;
      }

      if (e.key === "/" && text === "") {
        // Will be handled in onInput
      }

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (e.key === "b") {
          e.preventDefault();
          document.execCommand("bold");
          return;
        }
        if (e.key === "i") {
          e.preventDefault();
          document.execCommand("italic");
          return;
        }
        if (e.key === "u") {
          e.preventDefault();
          document.execCommand("underline");
          return;
        }
        if (e.key === "e") {
          e.preventDefault();
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed) {
            document.execCommand("insertHTML", false, `<code>${sel.toString()}</code>`);
          }
          return;
        }
      }
    },
    [blocks, slashMenu, handleCreateBlock, deleteBlock, updateBlock, focusBlock]
  );

  const handleInput = useCallback(
    (block: Block, e: React.FormEvent<HTMLElement>) => {
      const el = e.currentTarget;
      const text = el.textContent || "";

      for (const [prefix, type] of Object.entries(MARKDOWN_SHORTCUTS)) {
        if (text === prefix || (prefix === "---" && text === "---")) {
          if (prefix === "---") {
            updateBlock.mutate({ blockId: block.id, type: "divider", content: {} });
            return;
          }
          el.textContent = "";
          updateBlock.mutate({ blockId: block.id, type, content: { text: "" } });
          return;
        }
      }

      if (text.startsWith("/")) {
        const rect = el.getBoundingClientRect();
        setSlashMenu({
          blockId: block.id,
          position: { top: rect.bottom + 4, left: rect.left },
          filter: text.slice(1),
        });
      } else if (slashMenu && slashMenu.blockId === block.id) {
        setSlashMenu(null);
      }

      if (block.type === "code") {
        saveBlockContent(block.id, { ...block.content, text });
      } else {
        saveBlockContent(block.id, { ...block.content, text: el.innerHTML });
      }
    },
    [updateBlock, slashMenu, saveBlockContent]
  );

  const handleSlashSelect = useCallback(
    (type: BlockType) => {
      if (!slashMenu) return;
      const block = blocks.find((b) => b.id === slashMenu.blockId);

      // Image: open file picker instead of converting the block
      if (type === "image") {
        const afterSortOrder = block ? block.sortOrder : 0;
        setSlashMenu(null);
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          // Clear the slash command text from the trigger block
          if (block) {
            const el = blockRefs.current.get(block.id);
            if (el) el.textContent = "";
            updateBlock.mutate({ blockId: block.id, content: { text: "" } });
          }
          const formData = new FormData();
          formData.append("file", file);
          formData.append("source", "page_block");
          try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (!res.ok) return;
            const { url } = await res.json();
            createBlock.mutate({
              type: "image",
              content: { url, caption: "" },
              sort_order: afterSortOrder + 1,
            });
          } catch (err) {
            console.error("Image upload error:", err);
          }
        };
        input.click();
        return;
      }

      if (block) {
        const el = blockRefs.current.get(block.id);
        if (el) el.textContent = "";
        const content = type === "to_do" ? { text: "", checked: false } :
                       type === "callout" ? { text: "", icon: "\u{1F4A1}" } :
                       type === "divider" ? {} :
                       type === "code" ? { text: "", language: "javascript" } :
                       { text: "" };
        updateBlock.mutate({ blockId: block.id, type, content });
      }
      setSlashMenu(null);
    },
    [slashMenu, blocks, updateBlock, createBlock]
  );

  // Block handle click → open action menu
  const handleBlockHandleClick = useCallback(
    (blockId: string, rect: DOMRect) => {
      setActionMenuBlockId((prev) => (prev === blockId ? null : blockId));
      setActionMenuPos({ top: rect.bottom + 4, left: rect.left });
    },
    [],
  );

  // Block click with shift → multi-select
  const handleBlockClick = useCallback(
    (blockId: string, e: React.MouseEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        setSelectedBlockIds((prev) => {
          const next = new Set(prev);
          // If we already have a selection, select the range
          if (next.size > 0) {
            const firstSelectedIdx = blocks.findIndex((b) => next.has(b.id));
            const clickedIdx = blocks.findIndex((b) => b.id === blockId);
            if (firstSelectedIdx !== -1 && clickedIdx !== -1) {
              const start = Math.min(firstSelectedIdx, clickedIdx);
              const end = Math.max(firstSelectedIdx, clickedIdx);
              const rangeSet = new Set<string>();
              for (let i = start; i <= end; i++) {
                rangeSet.add(blocks[i].id);
              }
              return rangeSet;
            }
          }
          if (next.has(blockId)) {
            next.delete(blockId);
          } else {
            next.add(blockId);
          }
          return next;
        });
      } else {
        // Normal click clears selection
        if (selectedBlockIds.size > 0) {
          setSelectedBlockIds(new Set());
        }
      }
    },
    [blocks, selectedBlockIds],
  );

  // Action menu callbacks
  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      const index = blocks.findIndex((b) => b.id === blockId);
      deleteBlock.mutate(blockId);
      if (index > 0) {
        setFocusBlockId(blocks[index - 1].id);
      }
      setActionMenuBlockId(null);
    },
    [blocks, deleteBlock],
  );

  const handleDuplicateBlock = useCallback(
    (blockId: string) => {
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;
      const index = blocks.indexOf(block);
      createBlock.mutate(
        {
          type: block.type,
          content: { ...block.content },
          sort_order: block.sortOrder + 500,
        },
        {
          onSuccess: (newBlock) => {
            setFocusBlockId(newBlock.id);
          },
        },
      );
      setActionMenuBlockId(null);
    },
    [blocks, createBlock],
  );

  const handleTurnInto = useCallback(
    (blockId: string, type: BlockType) => {
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;
      const content =
        type === "to_do"
          ? { text: (block.content as { text?: string }).text || "", checked: false }
          : type === "callout"
            ? { text: (block.content as { text?: string }).text || "", icon: "\u{1F4A1}" }
            : type === "divider"
              ? {}
              : type === "code"
                ? { text: (block.content as { text?: string }).text || "", language: "javascript" }
                : { text: (block.content as { text?: string }).text || "" };
      updateBlock.mutate({ blockId, type, content });
      setActionMenuBlockId(null);
    },
    [blocks, updateBlock],
  );

  const handleMoveBlock = useCallback(
    (blockId: string, direction: "up" | "down") => {
      const index = blocks.findIndex((b) => b.id === blockId);
      if (index === -1) return;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= blocks.length) return;

      const reordered = arrayMove(blocks, index, newIndex);
      reorderBlocks.mutate({
        blocks: reordered.map((b, i) => ({
          id: b.id,
          sort_order: i * 1000,
        })),
      });
      setActionMenuBlockId(null);
    },
    [blocks, reorderBlocks],
  );

  const handleDeleteSelected = useCallback(() => {
    for (const id of selectedBlockIds) {
      deleteBlock.mutate(id);
    }
    setSelectedBlockIds(new Set());
    setActionMenuBlockId(null);
  }, [selectedBlockIds, deleteBlock]);

  // Drag and drop handler
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggingBlockId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(blocks, oldIndex, newIndex);
      reorderBlocks.mutate({
        blocks: reordered.map((b, i) => ({
          id: b.id,
          sort_order: i * 1000,
        })),
      });
    },
    [blocks, reorderBlocks],
  );

  const draggingBlock = draggingBlockId
    ? blocks.find((b) => b.id === draggingBlockId)
    : null;

  // Upload an image file and create an image block
  const uploadAndCreateImageBlock = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", "page_block");

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Image upload failed:", err.error || res.status);
          return;
        }

        const { url } = await res.json();
        const lastSortOrder =
          blocks.length > 0 ? blocks[blocks.length - 1].sortOrder : 0;

        createBlock.mutate({
          type: "image",
          content: { url, caption: "" },
          sort_order: lastSortOrder + 1,
        });
      } catch (err) {
        console.error("Image upload error:", err);
      }
    },
    [blocks, createBlock]
  );

  // Intercept image paste events
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (!item.type.startsWith("image/")) continue;

        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        uploadAndCreateImageBlock(file);
        return;
      }
    },
    [uploadAndCreateImageBlock]
  );

  return (
    <div className="relative pb-32" onPaste={handlePaste}>
      {/* Draft recovery banner */}
      {draftRecovered && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-[var(--foreground)] shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 1v6l3 3" />
            <circle cx="8" cy="8" r="7" />
          </svg>
          <span>Unsaved changes recovered</span>
          <button
            onClick={() => setDraftRecovered(false)}
            className="ml-auto rounded px-2 py-0.5 text-xs hover:bg-[var(--muted)] transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Selection indicator */}
      {selectedBlockIds.size > 1 && (
        <div className="sticky top-0 z-30 mb-2 flex items-center gap-3 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm text-[var(--primary-foreground)] shadow-sm">
          <span>{selectedBlockIds.size} blocks selected</span>
          <button
            onClick={handleDeleteSelected}
            className="rounded px-2 py-0.5 text-xs hover:bg-white/20 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => setSelectedBlockIds(new Set())}
            className="ml-auto rounded px-2 py-0.5 text-xs hover:bg-white/20 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setDraggingBlockId(e.active.id as string)}
        onDragCancel={() => setDraggingBlockId(null)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {blocks.map((block, index) => (
            <SortableBlock
              key={block.id}
              block={block}
              index={index}
              blockRefs={blockRefs}
              isSelected={selectedBlockIds.has(block.id)}
              isDragOverlay={false}
              onKeyDown={(e) => handleKeyDown(e, block, index)}
              onInput={(e) => handleInput(block, e)}
              onCheckToggle={() => {
                const checked = !(block.content as { checked?: boolean }).checked;
                updateBlock.mutate({
                  blockId: block.id,
                  content: { ...block.content, checked },
                });
              }}
              onHandleClick={(rect) => handleBlockHandleClick(block.id, rect)}
              onBlockClick={(e) => handleBlockClick(block.id, e)}
            />
          ))}
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {draggingBlock && (
            <div className="opacity-80 bg-[var(--background)] rounded-lg shadow-lg ring-2 ring-[var(--primary)]/30">
              <StaticBlockRenderer
                block={draggingBlock}
                index={blocks.indexOf(draggingBlock)}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {blocks.length === 0 && (
        <div
          className="text-[var(--muted-foreground)]/50 cursor-text py-1"
          onClick={() => handleCreateBlock(-1)}
        >
          Click here to start writing...
        </div>
      )}

      {slashMenu && (
        <SlashCommandMenu
          position={slashMenu.position}
          filter={slashMenu.filter}
          onSelect={handleSlashSelect}
          onClose={() => setSlashMenu(null)}
        />
      )}

      {actionMenuBlockId && actionMenuPos && (
        <BlockActionMenu
          blockId={actionMenuBlockId}
          position={actionMenuPos}
          blockType={blocks.find((b) => b.id === actionMenuBlockId)?.type || "paragraph"}
          canMoveUp={blocks.findIndex((b) => b.id === actionMenuBlockId) > 0}
          canMoveDown={blocks.findIndex((b) => b.id === actionMenuBlockId) < blocks.length - 1}
          onDelete={handleDeleteBlock}
          onDuplicate={handleDuplicateBlock}
          onTurnInto={handleTurnInto}
          onMoveUp={(id) => handleMoveBlock(id, "up")}
          onMoveDown={(id) => handleMoveBlock(id, "down")}
          onClose={() => setActionMenuBlockId(null)}
        />
      )}
    </div>
  );
}

// ─── Sortable block wrapper ──────────────────────────────────────────────────

interface SortableBlockProps {
  block: Block;
  index: number;
  blockRefs: React.MutableRefObject<Map<string, HTMLElement>>;
  isSelected: boolean;
  isDragOverlay: boolean;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onInput: (e: React.FormEvent<HTMLElement>) => void;
  onCheckToggle: () => void;
  onHandleClick: (rect: DOMRect) => void;
  onBlockClick: (e: React.MouseEvent) => void;
}

function SortableBlock({
  block,
  index,
  blockRefs,
  isSelected,
  onKeyDown,
  onInput,
  onCheckToggle,
  onHandleClick,
  onBlockClick,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-block-wrapper
      className={`group/block relative flex items-start -ml-10 pl-10 ${
        isSelected ? "bg-[var(--primary)]/10 rounded" : ""
      }`}
      onClick={onBlockClick}
    >
      {/* Block handle — drag grip */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          onHandleClick(rect);
        }}
        className="absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded opacity-0 group-hover/block:opacity-100 hover:bg-[var(--accent)] transition-opacity cursor-grab active:cursor-grabbing text-[var(--muted-foreground)]"
        title="Drag to move / Click for options"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="4.5" cy="2.5" r="1.2" />
          <circle cx="9.5" cy="2.5" r="1.2" />
          <circle cx="4.5" cy="7" r="1.2" />
          <circle cx="9.5" cy="7" r="1.2" />
          <circle cx="4.5" cy="11.5" r="1.2" />
          <circle cx="9.5" cy="11.5" r="1.2" />
        </svg>
      </button>

      {/* Add block button — appears between blocks on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          // This is handled via the "+" icon to the left of the handle
        }}
        className="absolute left-6 top-0.5 flex h-6 w-6 items-center justify-center rounded opacity-0 group-hover/block:opacity-100 hover:bg-[var(--accent)] transition-opacity text-[var(--muted-foreground)]"
        title="Add block below"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="7" y1="2" x2="7" y2="12" />
          <line x1="2" y1="7" x2="12" y2="7" />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <BlockRenderer
          block={block}
          index={index}
          blockRefs={blockRefs}
          onKeyDown={onKeyDown}
          onInput={onInput}
          onCheckToggle={onCheckToggle}
        />
      </div>
    </div>
  );
}

// ─── Static block renderer for drag overlay ──────────────────────────────────

function StaticBlockRenderer({ block, index }: { block: Block; index: number }) {
  const text = (block.content as { text?: string }).text || "";
  const style = BLOCK_STYLES[block.type] || "text-base";

  if (block.type === "divider") {
    return (
      <div className="py-3 px-4">
        <hr className="border-[var(--border)]" />
      </div>
    );
  }

  const displayText = text.replace(/<[^>]+>/g, "");
  const truncated = displayText.length > 100 ? displayText.slice(0, 100) + "..." : displayText;

  return (
    <div className={`py-1 px-4 ${style}`}>
      {truncated || <span className="text-[var(--muted-foreground)]/40">Empty block</span>}
    </div>
  );
}

// ─── Block renderer ──────────────────────────────────────────────────────────

interface BlockRendererProps {
  block: Block;
  index: number;
  blockRefs: React.MutableRefObject<Map<string, HTMLElement>>;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onInput: (e: React.FormEvent<HTMLElement>) => void;
  onCheckToggle: () => void;
}

/**
 * Hook that sets innerHTML only on mount (or when block type/id changes),
 * preventing React re-renders from resetting cursor position in contentEditable.
 */
function useContentEditableRef(
  blockId: string,
  blockType: string,
  initialHtml: string,
  blockRefs: React.MutableRefObject<Map<string, HTMLElement>>,
) {
  const mountedKeyRef = useRef<string>("");

  const setRef = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      blockRefs.current.set(blockId, el);
      const key = `${blockId}:${blockType}`;
      if (mountedKeyRef.current !== key) {
        mountedKeyRef.current = key;
        el.innerHTML = initialHtml;
      }
    },
    [blockId, blockType, initialHtml, blockRefs],
  );

  return setRef;
}

function BlockRenderer({
  block,
  index,
  blockRefs,
  onKeyDown,
  onInput,
  onCheckToggle,
}: BlockRendererProps) {
  const text = (block.content as { text?: string }).text || "";
  const style = BLOCK_STYLES[block.type] || "text-base";
  const placeholder = BLOCK_PLACEHOLDER[block.type] || "";

  const setEditableRef = useContentEditableRef(block.id, block.type, text, blockRefs);

  if (block.type === "divider") {
    return (
      <div className="py-3">
        <hr className="border-[var(--border)]" />
      </div>
    );
  }

  if (block.type === "to_do") {
    const checked = (block.content as { checked?: boolean }).checked || false;
    return (
      <div className="flex items-start gap-2 py-0.5 hover:bg-[var(--accent)]/50 rounded -mx-2 px-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onCheckToggle}
          className="mt-1 h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
        />
        <div
          ref={setEditableRef}
          contentEditable
          suppressContentEditableWarning
          className={`flex-1 outline-none ${style} ${
            checked ? "line-through text-[var(--muted-foreground)]" : ""
          }`}
          onKeyDown={onKeyDown}
          onInput={onInput}
          data-placeholder={placeholder}
        />
      </div>
    );
  }

  if (block.type === "bulleted_list") {
    return (
      <div className="flex items-start gap-2 py-0.5 hover:bg-[var(--accent)]/50 rounded -mx-2 px-2">
        <span className="mt-0.5 text-[var(--muted-foreground)]">&bull;</span>
        <div
          ref={setEditableRef}
          contentEditable
          suppressContentEditableWarning
          className={`flex-1 outline-none ${style}`}
          onKeyDown={onKeyDown}
          onInput={onInput}
          data-placeholder={placeholder}
        />
      </div>
    );
  }

  if (block.type === "numbered_list") {
    return (
      <div className="flex items-start gap-2 py-0.5 hover:bg-[var(--accent)]/50 rounded -mx-2 px-2">
        <span className="mt-0.5 min-w-[1.25rem] text-right text-[var(--muted-foreground)]">
          {index + 1}.
        </span>
        <div
          ref={setEditableRef}
          contentEditable
          suppressContentEditableWarning
          className={`flex-1 outline-none ${style}`}
          onKeyDown={onKeyDown}
          onInput={onInput}
          data-placeholder={placeholder}
        />
      </div>
    );
  }

  if (block.type === "callout") {
    const icon = (block.content as { icon?: string }).icon || "\u{1F4A1}";
    return (
      <div className="flex items-start gap-3 rounded-md bg-[var(--muted)] p-3 my-1 hover:ring-1 hover:ring-[var(--border)]">
        <span className="text-xl leading-none mt-0.5">{icon}</span>
        <div
          ref={setEditableRef}
          contentEditable
          suppressContentEditableWarning
          className="flex-1 outline-none text-base"
          onKeyDown={onKeyDown}
          onInput={onInput}
          data-placeholder={placeholder}
        />
      </div>
    );
  }

  if (block.type === "code") {
    const language = (block.content as { language?: string }).language || "";
    return (
      <div className="my-1 rounded-md bg-[var(--muted)] overflow-hidden">
        {language && (
          <div className="px-3 py-1 text-xs text-[var(--muted-foreground)] border-b border-[var(--border)]/50">
            {language}
          </div>
        )}
        <pre
          ref={setEditableRef}
          contentEditable
          suppressContentEditableWarning
          className="p-3 font-mono text-sm outline-none whitespace-pre-wrap"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              return;
            }
            onKeyDown(e);
          }}
          onInput={onInput}
          data-placeholder="Code..."
        />
      </div>
    );
  }

  if (block.type === "image") {
    const url = (block.content as { url?: string }).url || "";
    const caption = (block.content as { caption?: string }).caption || "";
    return (
      <div className="my-2">
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={caption} className="max-w-full rounded-md" />
        )}
        {caption && (
          <p className="mt-1 text-sm text-[var(--muted-foreground)] text-center">{caption}</p>
        )}
      </div>
    );
  }

  if (block.type === "bookmark") {
    const url = (block.content as { url?: string }).url || "";
    const title = (block.content as { title?: string }).title || url;
    const description = (block.content as { description?: string }).description || "";
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="my-1 block rounded-md border border-[var(--border)] p-3 hover:bg-[var(--accent)] transition-colors"
      >
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2">{description}</p>
        )}
        <p className="mt-1 text-xs text-[var(--muted-foreground)] truncate">{url}</p>
      </a>
    );
  }

  // Default: paragraph, headings, quote, toggle
  return (
    <div className="py-0.5 hover:bg-[var(--accent)]/50 rounded -mx-2 px-2">
      <div
        ref={setEditableRef}
        contentEditable
        suppressContentEditableWarning
        className={`outline-none ${style} empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--muted-foreground)]/40`}
        onKeyDown={onKeyDown}
        onInput={onInput}
        data-placeholder={placeholder}
      />
    </div>
  );
}
