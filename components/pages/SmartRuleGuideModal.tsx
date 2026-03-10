"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/Modal";

// ---------------------------------------------------------------------------
// Slide data
// ---------------------------------------------------------------------------

const SLIDES = [
  {
    title: "Organize your inbox automatically",
    description:
      "Smart rules watch your incoming emails and automatically route them to the right page. No more manual sorting — your inbox organizes itself.",
    icon: (
      <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
        {/* Inbox */}
        <rect x="20" y="30" width="80" height="60" rx="8" stroke="var(--primary)" strokeWidth="2.5" fill="var(--primary)" fillOpacity="0.08" />
        <path d="M20 60h25l7 10h16l7-10h25" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Envelope 1 flying in */}
        <rect x="8" y="12" width="24" height="16" rx="3" stroke="var(--primary)" strokeWidth="2" fill="var(--primary)" fillOpacity="0.15" />
        <path d="M8 15l12 8 12-8" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Envelope 2 flying in */}
        <rect x="88" y="8" width="24" height="16" rx="3" stroke="var(--primary)" strokeWidth="2" fill="var(--primary)" fillOpacity="0.15" />
        <path d="M88 11l12 8 12-8" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Sparkle */}
        <path d="M100 40l2-6 2 6 6 2-6 2-2 6-2-6-6-2z" fill="var(--primary)" opacity="0.6" />
        {/* Arrow down */}
        <path d="M60 6v18m-5-5l5 5 5-5" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Sorted indicator */}
        <circle cx="45" cy="75" r="4" fill="var(--primary)" opacity="0.3" />
        <circle cx="60" cy="75" r="4" fill="var(--primary)" opacity="0.5" />
        <circle cx="75" cy="75" r="4" fill="var(--primary)" opacity="0.7" />
      </svg>
    ),
  },
  {
    title: "Describe your page, AI writes the rule",
    description:
      "Create a page and describe what it's about. Our AI generates a smart classification rule that understands the nuance of your emails — no complex filters needed.",
    icon: (
      <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
        {/* Document */}
        <rect x="25" y="15" width="50" height="65" rx="6" stroke="var(--primary)" strokeWidth="2.5" fill="var(--primary)" fillOpacity="0.08" />
        <line x1="35" y1="32" x2="65" y2="32" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <line x1="35" y1="42" x2="60" y2="42" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <line x1="35" y1="52" x2="55" y2="52" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        {/* AI sparkle burst */}
        <circle cx="85" cy="35" r="18" fill="var(--primary)" fillOpacity="0.1" stroke="var(--primary)" strokeWidth="2" />
        <path d="M85 27l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="var(--primary)" />
        {/* Arrow from doc to sparkle */}
        <path d="M72 38h6" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
        {/* Generated rule output */}
        <rect x="30" y="88" width="60" height="20" rx="5" stroke="var(--primary)" strokeWidth="2" fill="var(--primary)" fillOpacity="0.12" />
        <line x1="38" y1="98" x2="82" y2="98" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        {/* Arrow down to rule */}
        <path d="M60 80v5" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    title: "Emails land where they belong",
    description:
      "Matched emails are automatically tagged, key content is extracted into your pages, and messages can even move to dedicated Outlook folders. Your knowledge builds itself.",
    icon: (
      <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
        {/* Three page cards fanned */}
        <rect x="12" y="30" width="36" height="50" rx="5" stroke="var(--primary)" strokeWidth="2" fill="var(--primary)" fillOpacity="0.06" transform="rotate(-5 30 55)" />
        <rect x="42" y="28" width="36" height="50" rx="5" stroke="var(--primary)" strokeWidth="2" fill="var(--primary)" fillOpacity="0.10" />
        <rect x="72" y="30" width="36" height="50" rx="5" stroke="var(--primary)" strokeWidth="2" fill="var(--primary)" fillOpacity="0.06" transform="rotate(5 90 55)" />
        {/* Content lines on middle card */}
        <line x1="49" y1="40" x2="71" y2="40" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <line x1="49" y1="48" x2="68" y2="48" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <line x1="49" y1="56" x2="65" y2="56" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
        {/* Checkmark badges */}
        <circle cx="30" cy="45" r="8" fill="var(--primary)" fillOpacity="0.2" />
        <path d="M26 45l3 3 5-6" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="90" cy="45" r="8" fill="var(--primary)" fillOpacity="0.2" />
        <path d="M86 45l3 3 5-6" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Envelope arriving at top */}
        <rect x="48" y="6" width="24" height="16" rx="3" stroke="var(--primary)" strokeWidth="2" fill="var(--primary)" fillOpacity="0.15" />
        <path d="M48 9l12 8 12-8" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Arrows from envelope to cards */}
        <path d="M54 22l-16 12" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" opacity="0.5" />
        <path d="M60 22v8" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" opacity="0.5" />
        <path d="M66 22l16 12" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" opacity="0.5" />
        {/* Tag labels */}
        <rect x="22" y="90" width="28" height="14" rx="7" fill="var(--primary)" fillOpacity="0.15" stroke="var(--primary)" strokeWidth="1.5" />
        <rect x="56" y="90" width="20" height="14" rx="7" fill="var(--primary)" fillOpacity="0.2" stroke="var(--primary)" strokeWidth="1.5" />
        <rect x="82" y="90" width="24" height="14" rx="7" fill="var(--primary)" fillOpacity="0.15" stroke="var(--primary)" strokeWidth="1.5" />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SmartRuleGuideModalProps {
  onCreatePage: () => void;
}

export function SmartRuleGuideModal({ onCreatePage }: SmartRuleGuideModalProps) {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [hasRules, setHasRules] = useState<boolean | null>(null);

  const forceShow = searchParams.get("showSmartRuleGuide") === "true";

  // Check whether the user has any active smart rules
  useEffect(() => {
    let cancelled = false;
    fetch("/api/pages/smart-rules")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const count = d.data?.length ?? 0;
        setHasRules(count > 0);
      })
      .catch(() => {
        if (!cancelled) setHasRules(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Open the modal when appropriate
  useEffect(() => {
    if (hasRules === null) return; // still loading
    if (forceShow || !hasRules) {
      setOpen(true);
      setStep(0);
    }
  }, [hasRules, forceShow]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setStep(0);
  }, []);

  const handleNext = useCallback(() => {
    if (step < SLIDES.length - 1) {
      setStep((s) => s + 1);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleCreate = useCallback(() => {
    handleClose();
    onCreatePage();
  }, [handleClose, onCreatePage]);

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="flex flex-col items-center text-center">
        {/* Illustration */}
        <div className="w-28 h-28 mb-5">
          {slide.icon}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          {slide.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-6 max-w-sm">
          {slide.description}
        </p>

        {/* Dot indicators */}
        <div className="flex items-center gap-2 mb-5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === step
                  ? "w-6 bg-[var(--primary)]"
                  : "w-2 bg-[var(--muted-foreground)]/30 hover:bg-[var(--muted-foreground)]/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3 w-full">
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              Skip
            </button>
          )}

          {isLast ? (
            <button
              onClick={handleCreate}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              Create Your First Page
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
