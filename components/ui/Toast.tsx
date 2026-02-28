"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastVariant = "default" | "success" | "destructive";

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  /** Internal flag used to trigger the exit animation before removal. */
  exiting?: boolean;
}

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Variant styles
// ---------------------------------------------------------------------------

const variantClasses: Record<ToastVariant, string> = {
  default:
    "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]",
  success:
    "border-green-500/40 bg-green-950/80 text-green-100",
  destructive:
    "border-[var(--destructive)]/40 bg-red-950/80 text-red-100",
};

// ---------------------------------------------------------------------------
// Single toast item
// ---------------------------------------------------------------------------

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  // Trigger enter animation on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // When marked as exiting, play the exit animation then remove
  useEffect(() => {
    if (toast.exiting) {
      setVisible(false);
    }
  }, [toast.exiting]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "pointer-events-auto w-80 rounded-lg border px-4 py-3 shadow-lg",
        "transition-all duration-300 ease-in-out",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0",
        variantClasses[toast.variant],
      ].join(" ")}
      onTransitionEnd={() => {
        if (toast.exiting) onDismiss(toast.id);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-xs opacity-80">{toast.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  // Schedule auto-dismiss (mark as exiting so animation runs first)
  const scheduleExit = useCallback((id: string) => {
    if (timersRef.current.has(id)) return;
    const timer = setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      timersRef.current.delete(id);
    }, AUTO_DISMISS_MS);
    timersRef.current.set(id, timer);
  }, []);

  // Actually remove from state after exit animation completes
  const handleDismiss = useCallback((id: string) => {
    const existing = timersRef.current.get(id);
    if (existing) {
      clearTimeout(existing);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newToast: ToastMessage = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? "default",
      };

      setToasts((prev) => {
        // If we already have MAX_VISIBLE, mark the oldest as exiting
        const next = [...prev, newToast];
        if (next.filter((t) => !t.exiting).length > MAX_VISIBLE) {
          const oldest = next.find((t) => !t.exiting);
          if (oldest) oldest.exiting = true;
        }
        return next;
      });

      scheduleExit(id);
    },
    [scheduleExit]
  );

  // Cleanup on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container – bottom-right, z-60 */}
      <div
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[60] flex flex-col-reverse gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={handleDismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
