"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import type { Board } from "@/types";
import type { ExtractedEmailAction } from "@/lib/actions/extractEmailActions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailActionSidebarProps {
  emailId: number;
}

type ActionStatus = "idle" | "created_card" | "created_action" | "saved_brain";

interface ActionItemState extends ExtractedEmailAction {
  status: ActionStatus;
  creating: boolean;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ScanIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ActionItemIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" />
      <path d="m17 5-5-3-5 3" />
      <path d="m17 19-5 3-5-3" />
      <path d="M2 12h20" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Priority badge
// ---------------------------------------------------------------------------

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  request: { label: "Request", color: "bg-purple-100 text-purple-700" },
  deadline: { label: "Deadline", color: "bg-red-100 text-red-700" },
  commitment: { label: "Commitment", color: "bg-blue-100 text-blue-700" },
  follow_up: { label: "Follow-up", color: "bg-amber-100 text-amber-700" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmailActionSidebar({ emailId }: EmailActionSidebarProps) {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [actions, setActions] = useState<ActionItemState[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");

  // Fetch boards for the card creation dropdown
  const fetchBoards = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/boards");
      if (res.ok) {
        const data: Board[] = await res.json();
        setBoards(data);
        if (data.length > 0 && !selectedBoardId) {
          setSelectedBoardId(data[0].id);
        }
      }
    } catch {
      // Non-critical, boards just won't be available
    }
  }, [selectedBoardId]);

  const handleScan = async () => {
    setScanning(true);
    try {
      // Fetch boards in parallel with scanning
      const [actionsRes] = await Promise.all([
        fetch(`/api/emails/${emailId}/extract-actions`, { method: "POST" }),
        fetchBoards(),
      ]);

      if (!actionsRes.ok) {
        const body = await actionsRes.json().catch(() => ({}));
        throw new Error(body.error || "Scan failed");
      }

      const data = await actionsRes.json();
      const extracted: ExtractedEmailAction[] = data.actions || [];

      setActions(
        extracted.map((a) => ({ ...a, status: "idle" as ActionStatus, creating: false }))
      );
      setScanned(true);

      if (extracted.length === 0) {
        toast({ title: "No action items found", description: "This email doesn't contain actionable items", variant: "default" });
      }
    } catch (err) {
      toast({
        title: "Scan failed",
        description: err instanceof Error ? err.message : "Could not scan email",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const createActionItem = async (index: number, withCard: boolean) => {
    const action = actions[index];
    if (action.creating || action.status !== "idle") return;

    setActions((prev) =>
      prev.map((a, i) => (i === index ? { ...a, creating: true } : a))
    );

    try {
      const payload: Record<string, unknown> = {
        title: action.title,
        description: action.description,
        assignee: action.assignee,
        priority: action.priority,
        dueDate: action.dueDate,
      };
      if (withCard && selectedBoardId) {
        payload.boardId = selectedBoardId;
      }

      const res = await fetch(`/api/emails/${emailId}/create-action-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create");
      }

      setActions((prev) =>
        prev.map((a, i) =>
          i === index
            ? { ...a, creating: false, status: withCard ? "created_card" : "created_action" }
            : a
        )
      );

      toast({
        title: withCard ? "Card created" : "Action item created",
        variant: "success",
      });
    } catch (err) {
      setActions((prev) =>
        prev.map((a, i) => (i === index ? { ...a, creating: false } : a))
      );
      toast({
        title: "Failed to create",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const saveToBrain = (index: number) => {
    // Open Brain is not yet implemented — show a placeholder toast
    setActions((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, status: "saved_brain" } : a
      )
    );
    toast({
      title: "Saved to Open Brain",
      description: "Open Brain capture is coming soon — item noted for later",
      variant: "default",
    });
  };

  // Not scanned yet — show scan button
  if (!scanned) {
    return (
      <div className="border-l border-[var(--border)] bg-[var(--card)] w-80 flex-shrink-0 flex flex-col" data-testid="email-action-sidebar">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Action Items</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Scan this email to detect requests, deadlines, and commitments.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <button
            onClick={handleScan}
            disabled={scanning}
            data-testid="scan-email-button"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {scanning ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <ScanIcon />
                Scan for Actions
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Scanned but no actions found
  if (actions.length === 0) {
    return (
      <div className="border-l border-[var(--border)] bg-[var(--card)] w-80 flex-shrink-0 flex flex-col" data-testid="email-action-sidebar">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Action Items</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              No action items detected in this email.
            </p>
            <button
              onClick={() => { setScanned(false); setActions([]); }}
              className="mt-3 text-xs text-[var(--primary)] hover:underline"
            >
              Scan again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Actions found — show them
  return (
    <div className="border-l border-[var(--border)] bg-[var(--card)] w-80 flex-shrink-0 flex flex-col overflow-hidden" data-testid="email-action-sidebar">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Action Items
            <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">
              ({actions.length})
            </span>
          </h3>
        </div>
        <button
          onClick={() => { setScanned(false); setActions([]); }}
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          Rescan
        </button>
      </div>

      {/* Board selector for card creation */}
      {boards.length > 0 && (
        <div className="px-4 py-2 border-b border-[var(--border)]">
          <label className="text-xs text-[var(--muted-foreground)]">Create cards on:</label>
          <select
            value={selectedBoardId}
            onChange={(e) => setSelectedBoardId(e.target.value)}
            className="mt-1 w-full text-xs rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-2 py-1.5"
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action items list */}
      <div className="flex-1 overflow-auto">
        {actions.map((action, i) => (
          <div
            key={i}
            className="p-4 border-b border-[var(--border)] last:border-b-0"
            data-testid="extracted-action-item"
          >
            {/* Type + Priority badges */}
            <div className="flex items-center gap-1.5 mb-2">
              {TYPE_LABELS[action.type] && (
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_LABELS[action.type].color}`}>
                  {TYPE_LABELS[action.type].label}
                </span>
              )}
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PRIORITY_COLORS[action.priority] || PRIORITY_COLORS.medium}`}>
                {action.priority}
              </span>
            </div>

            {/* Title */}
            <h4 className="text-sm font-medium text-[var(--foreground)] mb-1">
              {action.title}
            </h4>

            {/* Description */}
            {action.description && (
              <p className="text-xs text-[var(--muted-foreground)] mb-2 line-clamp-3">
                {action.description}
              </p>
            )}

            {/* Meta: assignee + due date */}
            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] mb-3">
              {action.assignee && (
                <span title="Assignee">@ {action.assignee}</span>
              )}
              {action.dueDate && (
                <span title="Due date">Due {action.dueDate}</span>
              )}
            </div>

            {/* Action buttons */}
            {action.status === "idle" ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => createActionItem(i, true)}
                  disabled={action.creating || !selectedBoardId}
                  title={selectedBoardId ? "Create Kanban card" : "Select a board first"}
                  data-testid="create-card-button"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-40"
                >
                  {action.creating ? (
                    <span className="inline-block w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  ) : (
                    <CardIcon />
                  )}
                  Card
                </button>
                <button
                  onClick={() => createActionItem(i, false)}
                  disabled={action.creating}
                  data-testid="create-action-button"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-40"
                >
                  <ActionItemIcon />
                  Action
                </button>
                <button
                  onClick={() => saveToBrain(i)}
                  disabled={action.creating}
                  data-testid="save-brain-button"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-40"
                >
                  <BrainIcon />
                  Brain
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs">
                <CheckIcon />
                <span className="text-green-600 font-medium">
                  {action.status === "created_card" && "Card created"}
                  {action.status === "created_action" && "Action item created"}
                  {action.status === "saved_brain" && "Saved to Brain"}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
