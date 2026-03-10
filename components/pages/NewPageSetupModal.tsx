"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useUpdatePage } from "@/lib/hooks/usePages";

interface NewPageSetupModalProps {
  open: boolean;
  onClose: () => void;
  pageId: string;
  pageName: string;
  onPageNameChange: (name: string) => void;
}

type Step = "describe" | "review";

export function NewPageSetupModal({
  open,
  onClose,
  pageId,
  pageName,
  onPageNameChange,
}: NewPageSetupModalProps) {
  const [step, setStep] = useState<Step>("describe");
  const [description, setDescription] = useState("");
  const [generatedRule, setGeneratedRule] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const updatePage = useUpdatePage(pageId);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/pages/generate-smart-rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to generate rule");
      }
      const data = await res.json();
      setGeneratedRule(data.smartRule);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    const title = pageName.trim() || "Untitled";
    updatePage.mutate(
      {
        title,
        smart_rule: generatedRule,
        smart_active: true,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  const handleSkip = () => {
    if (pageName.trim()) {
      updatePage.mutate({ title: pageName.trim() });
    }
    handleClose();
  };

  const handleClose = () => {
    setStep("describe");
    setDescription("");
    setGeneratedRule("");
    setError("");
    setGenerating(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Set Up Your Page">
      {step === "describe" && (
        <div>
          {/* Page name */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Page Name
            </label>
            <input
              type="text"
              value={pageName}
              onChange={(e) => onPageNameChange(e.target.value)}
              placeholder="e.g., Project Phoenix, Q2 Planning"
              autoFocus
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              What is this page about?
            </label>
            <p className="mb-2 text-xs text-[var(--muted-foreground)]">
              Describe the purpose of this page so we can automatically route
              relevant emails and meeting content here.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., This page tracks everything related to our new payment integration project — design discussions, vendor emails, architecture decisions, and sprint meetings."
              rows={4}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          {error && (
            <p className="mb-3 text-xs text-[var(--destructive)]">{error}</p>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!description.trim() || generating}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <SpinnerIcon />
                  Generating...
                </>
              ) : (
                <>
                  <SparkleIcon />
                  Generate Smart Rule
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div>
          <p className="mb-3 text-sm text-[var(--muted-foreground)]">
            Based on your description, here&apos;s the smart rule we&apos;ll use
            to automatically collect content for this page. You can edit it if
            needed.
          </p>

          <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
            <div className="mb-2 flex items-center gap-2">
              <SparkleIcon className="text-[var(--primary)]" />
              <span className="text-xs font-semibold text-[var(--foreground)]">
                Smart Rule
              </span>
            </div>
            <textarea
              value={generatedRule}
              onChange={(e) => setGeneratedRule(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          {error && (
            <p className="mb-3 text-xs text-[var(--destructive)]">{error}</p>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("describe")}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Back
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={updatePage.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {updatePage.isPending ? "Saving..." : "Save & Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
