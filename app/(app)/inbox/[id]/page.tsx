"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { EmailActionSidebar } from "@/components/email/EmailActionSidebar";
import { SendToPageModal } from "@/components/email/SendToPageModal";
import { CopyToPageToolbar } from "@/components/email/CopyToPageToolbar";
import { SplitButton } from "@/components/email/SplitButton";
import { ComposePane, type ComposeAction } from "@/components/email/ComposePane";
import { useComposeShortcuts } from "@/hooks/useComposeShortcuts";
import type { EmailDetail, EmailAttachmentMetadata, EmailLabelChip } from "@/types/email";

interface LabelDef {
  id: string;
  name: string;
  color: string;
  is_system: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mimeIcon(contentType: string): string {
  if (contentType.startsWith("image/")) return "img";
  if (contentType === "application/pdf") return "pdf";
  if (contentType.includes("spreadsheet") || contentType.includes("excel")) return "xls";
  if (contentType.includes("document") || contentType.includes("word")) return "doc";
  if (contentType.includes("presentation") || contentType.includes("powerpoint")) return "ppt";
  if (contentType.includes("zip") || contentType.includes("compressed")) return "zip";
  return "file";
}

function AttachmentBadge({ attachment }: { attachment: EmailAttachmentMetadata }) {
  const icon = mimeIcon(attachment.contentType);
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-sm">
      <span className="font-mono text-xs uppercase text-[var(--muted-foreground)] bg-[var(--accent)] px-1.5 py-0.5 rounded">
        {icon}
      </span>
      <span className="text-[var(--foreground)] truncate max-w-[200px]" title={attachment.name}>
        {attachment.name}
      </span>
      <span className="text-[var(--muted-foreground)] text-xs">
        ({formatSize(attachment.size)})
      </span>
    </div>
  );
}

/**
 * Renders sanitized email HTML inside an iframe with a white background,
 * isolating inline email styles from the app's dark mode theme.
 */
function EmailHtmlFrame({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(300);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`<!DOCTYPE html>
<html><head><style>
  body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  img { max-width: 100%; height: auto; }
  a { color: #2563eb; }
  pre, code { white-space: pre-wrap; }
  table { max-width: 100%; }
</style></head><body>${html}</body></html>`);
    doc.close();

    // Resize iframe to fit content
    const resize = () => {
      if (doc.body) {
        setHeight(doc.body.scrollHeight);
      }
    };

    // Resize after images load
    const images = doc.querySelectorAll("img");
    let loaded = 0;
    const onImgLoad = () => { loaded++; if (loaded >= images.length) resize(); };
    images.forEach((img) => {
      if (img.complete) { loaded++; } else { img.addEventListener("load", onImgLoad); img.addEventListener("error", onImgLoad); }
    });

    // Initial resize with a short delay for rendering
    resize();
    const timer = setTimeout(resize, 200);

    return () => {
      clearTimeout(timer);
      images.forEach((img) => { img.removeEventListener("load", onImgLoad); img.removeEventListener("error", onImgLoad); });
    };
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin"
      style={{ width: "100%", height, border: "none", borderRadius: "8px" }}
      title="Email content"
    />
  );
}

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [emailLabels, setEmailLabels] = useState<(EmailLabelChip & { assigned_by?: string })[]>([]);
  const [allLabels, setAllLabels] = useState<LabelDef[]>([]);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [classifyingOne, setClassifyingOne] = useState(false);

  // Compose pane state
  const [composeAction, setComposeAction] = useState<ComposeAction | null>(null);
  const [composeAiMode, setComposeAiMode] = useState(false);

  // Send to Page state
  const [showSendToPage, setShowSendToPage] = useState(false);
  const [sendToPageSelectedText, setSendToPageSelectedText] = useState<string | undefined>();
  const emailBodyRef = useRef<HTMLDivElement>(null);

  // Determine if this is an Outlook email (compose only for Outlook)
  const isOutlookEmail = email ? !isNaN(Number(email.id)) : false;

  // Compute default recipients for compose pane
  const getDefaultRecipients = useCallback(
    (action: ComposeAction) => {
      if (!email) return { to: [], cc: [] };
      if (action === "forward") return { to: [], cc: [] };
      if (action === "reply") return { to: [email.sender], cc: [] };
      // reply_all: To = sender, CC = original To + CC minus sender and self
      const allRecipients = [...email.recipients, ...email.cc];
      const ccList = allRecipients.filter(
        (e) => e !== email.sender && !e.includes("noreply")
      );
      return { to: [email.sender], cc: ccList };
    },
    [email]
  );

  const openCompose = useCallback(
    (action: ComposeAction, aiMode: boolean) => {
      if (!isOutlookEmail) return;
      setComposeAction(action);
      setComposeAiMode(aiMode);
    },
    [isOutlookEmail]
  );

  const closeCompose = useCallback(() => {
    setComposeAction(null);
    setComposeAiMode(false);
  }, []);

  // Keyboard shortcuts
  useComposeShortcuts({
    onAction: openCompose,
    onClose: closeCompose,
    isOpen: composeAction !== null,
  });

  // Fetch labels for this email and all available labels
  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/emails/${params.id}/labels`)
      .then((r) => r.json())
      .then((d) => { if (d.data) setEmailLabels(d.data); })
      .catch(() => {});
    fetch("/api/emails/labels")
      .then((r) => r.json())
      .then((d) => { if (d.data) setAllLabels(d.data); })
      .catch(() => {});
  }, [params.id]);

  const handleAddLabel = async (labelId: string) => {
    try {
      const res = await fetch(`/api/emails/${params.id}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelId }),
      });
      if (!res.ok) throw new Error("Failed to add label");
      const { data } = await res.json();
      setEmailLabels(data);
      setShowLabelDropdown(false);
    } catch {
      toast({ title: "Failed to add label", variant: "destructive" });
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      const res = await fetch(`/api/emails/${params.id}/labels?labelId=${labelId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove label");
      setEmailLabels((prev) => prev.filter((l) => l.id !== labelId));
    } catch {
      toast({ title: "Failed to remove label", variant: "destructive" });
    }
  };

  const handleClassifyOne = async () => {
    setClassifyingOne(true);
    try {
      const res = await fetch("/api/emails/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId: Number(params.id) }),
      });
      if (!res.ok) throw new Error("Failed to classify");
      toast({ title: "Email classified", variant: "success" });
      // Refresh labels
      const labelsRes = await fetch(`/api/emails/${params.id}/labels`);
      const labelsData = await labelsRes.json();
      if (labelsData.data) setEmailLabels(labelsData.data);
    } catch {
      toast({ title: "Classification failed", variant: "destructive" });
    } finally {
      setClassifyingOne(false);
    }
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setDeleting(true);
    try {
      const res = await fetch(`/api/emails/${params.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete");
      }
      toast({ title: "Email deleted", variant: "success" });
      router.push("/inbox");
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Failed to delete email",
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  useEffect(() => {
    async function fetchEmail() {
      try {
        const res = await fetch(`/api/emails/${params.id}`);
        if (res.status === 404) {
          setError("Email not found.");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch email");
        const data: EmailDetail = await res.json();
        setEmail(data);

        // Auto-mark as read when opening
        fetch(`/api/emails/${params.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_read: true }),
        }).catch(() => {});
      } catch {
        setError("Failed to load email. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchEmail();
  }, [params.id]);


  if (loading) {
    return (
      <div className="flex h-full flex-col bg-[var(--background)]">
        <header className="border-b border-[var(--border)] px-6 py-4">
          <div className="h-5 bg-[var(--secondary)] rounded w-32 animate-pulse" />
        </header>
        <div className="flex-1 p-6 space-y-4 animate-pulse">
          <div className="h-8 bg-[var(--secondary)] rounded w-3/4" />
          <div className="h-4 bg-[var(--secondary)] rounded w-1/2" />
          <div className="h-4 bg-[var(--secondary)] rounded w-1/3" />
          <div className="h-4 bg-[var(--secondary)] rounded w-1/4" />
          <div className="h-px bg-[var(--border)] my-6" />
          <div className="space-y-2">
            <div className="h-4 bg-[var(--secondary)] rounded w-full" />
            <div className="h-4 bg-[var(--secondary)] rounded w-5/6" />
            <div className="h-4 bg-[var(--secondary)] rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="flex h-full flex-col bg-[var(--background)]">
        <header className="border-b border-[var(--border)] px-6 py-4">
          <Link
            href="/inbox"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Inbox
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-medium text-[var(--foreground)] mb-2">
              {error || "Email not found"}
            </h2>
            <Link href="/inbox" className="text-sm text-[var(--primary)] hover:underline">
              Return to Inbox
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sanitizedHtml = email.body_html
    ? DOMPurify.sanitize(email.body_html, {
        FORBID_TAGS: ["script", "style"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
        ALLOW_DATA_ATTR: false,
      })
    : null;

  const attachments: EmailAttachmentMetadata[] = Array.isArray(email.attachments_metadata)
    ? email.attachments_metadata
    : [];

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Back nav */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md px-3 md:px-6 py-2 md:py-3 flex items-center justify-between">
        <Link
          href="/inbox"
          className="inline-flex items-center gap-1.5 md:gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="hidden sm:inline">Back to Inbox</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <div className="flex items-center gap-1.5 md:gap-2">
          {email.web_link && (
            <a
              href={email.web_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 p-2 md:px-3 md:py-1.5 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
              <span className="hidden md:inline">Open in Outlook</span>
            </a>
          )}
          {isOutlookEmail && (
            <>
              <SplitButton
                label="Reply"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 17 4 12 9 7" />
                    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                  </svg>
                }
                onClick={() => openCompose("reply", false)}
                dropdownLabel="Reply with AI"
                onDropdownClick={() => openCompose("reply", true)}
                active={composeAction === "reply"}
              />
              <SplitButton
                label="Reply All"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 17 4 12 9 7" />
                    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                    <polyline points="13 17 8 12 13 7" />
                  </svg>
                }
                onClick={() => openCompose("reply_all", false)}
                dropdownLabel="Reply All with AI"
                onDropdownClick={() => openCompose("reply_all", true)}
                active={composeAction === "reply_all"}
              />
              <SplitButton
                label="Forward"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 17 20 12 15 7" />
                    <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                  </svg>
                }
                onClick={() => openCompose("forward", false)}
                dropdownLabel="Forward with AI"
                onDropdownClick={() => openCompose("forward", true)}
                active={composeAction === "forward"}
              />
            </>
          )}
          <button
            onClick={() => {
              setSendToPageSelectedText(undefined);
              setShowSendToPage(true);
            }}
            className="inline-flex items-center gap-2 p-2 md:px-3 md:py-1.5 text-sm font-medium rounded-lg border border-[var(--border)] text-emerald-600 hover:bg-emerald-500/10 transition-colors"
            title="Send to Page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
            <span className="hidden md:inline">Send to Page</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
            className="inline-flex items-center gap-2 p-2 md:px-3 md:py-1.5 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors disabled:opacity-40"
            title="Delete email"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            <span className="hidden md:inline">{deleting ? "Deleting..." : "Delete"}</span>
          </button>
        </div>
      </header>

      {/* Message content + sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-3 py-4 md:px-6 md:py-6">
            {/* Headers */}
            <div className="space-y-3 mb-6">
              <h1 className="text-lg md:text-2xl font-bold text-[var(--foreground)]">
                {email.subject || "(No subject)"}
              </h1>

              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="text-[var(--muted-foreground)] w-12 flex-shrink-0">From</span>
                  <span className="text-[var(--foreground)]">{email.sender}</span>
                </div>

                {email.recipients.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-[var(--muted-foreground)] w-12 flex-shrink-0">To</span>
                    <span className="text-[var(--foreground)]">
                      {email.recipients.join(", ")}
                    </span>
                  </div>
                )}

                {email.cc.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-[var(--muted-foreground)] w-12 flex-shrink-0">CC</span>
                    <span className="text-[var(--foreground)]">
                      {email.cc.join(", ")}
                    </span>
                  </div>
                )}

                {email.bcc.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-[var(--muted-foreground)] w-12 flex-shrink-0">BCC</span>
                    <span className="text-[var(--foreground)]">
                      {email.bcc.join(", ")}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <span className="text-[var(--muted-foreground)] w-12 flex-shrink-0">Date</span>
                  <span className="text-[var(--foreground)]">
                    {formatDate(email.received_at)}
                  </span>
                </div>
              </div>

              {/* Smart Labels */}
              <div className="flex items-center gap-2 flex-wrap mt-3" data-testid="email-detail-labels">
                {emailLabels.map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium group/label"
                    style={{
                      backgroundColor: label.color + "22",
                      color: label.color,
                      border: `1px solid ${label.color}44`,
                    }}
                    title={label.confidence != null ? `${label.name} (${label.confidence}% confidence)` : label.name}
                  >
                    {label.name}
                    <button
                      onClick={() => handleRemoveLabel(label.id)}
                      className="opacity-0 group-hover/label:opacity-100 ml-0.5 transition-opacity"
                      title="Remove label"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </span>
                ))}

                {/* Add label button */}
                <div className="relative">
                  <button
                    onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                    className="text-xs px-2 py-1 rounded-full border border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors"
                  >
                    + Label
                  </button>
                  {showLabelDropdown && (
                    <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1">
                      {allLabels
                        .filter((l) => !emailLabels.some((el) => el.id === l.id))
                        .map((label) => (
                          <button
                            key={label.id}
                            onClick={() => handleAddLabel(label.id)}
                            className="w-full text-left px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] flex items-center gap-2"
                          >
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                            {label.name}
                          </button>
                        ))}
                      {allLabels.filter((l) => !emailLabels.some((el) => el.id === l.id)).length === 0 && (
                        <p className="px-3 py-1.5 text-xs text-[var(--muted-foreground)]">All labels assigned</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Classify with AI button */}
                <button
                  onClick={handleClassifyOne}
                  disabled={classifyingOne}
                  className="text-xs px-2 py-1 rounded-full border border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors disabled:opacity-40"
                  title="Auto-classify this email with AI"
                >
                  {classifyingOne ? "Classifying..." : "AI Classify"}
                </button>
              </div>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="border-t border-b border-[var(--border)] py-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att, i) => (
                    <AttachmentBadge key={i} attachment={att} />
                  ))}
                </div>
              </div>
            )}

            {/* Body */}
            <div ref={emailBodyRef} className="border-t border-[var(--border)] pt-6">
              {sanitizedHtml ? (
                <EmailHtmlFrame html={sanitizedHtml} />
              ) : email.body_plain_text ? (
                <pre className="whitespace-pre-wrap text-sm text-[var(--foreground)] font-sans leading-relaxed">
                  {email.body_plain_text}
                </pre>
              ) : (
                <p className="text-[var(--muted-foreground)] italic">
                  No message body
                </p>
              )}
            </div>

            {/* Floating Copy to Page toolbar on text selection */}
            <CopyToPageToolbar
              containerRef={emailBodyRef}
              onCopyToPage={(text) => {
                setSendToPageSelectedText(text);
                setShowSendToPage(true);
              }}
            />
          </div>

            {/* Compose Pane (inline below email body) */}
            {composeAction && email && (
              <ComposePane
                emailId={email.id}
                action={composeAction}
                aiMode={composeAiMode}
                defaultTo={getDefaultRecipients(composeAction).to}
                defaultCc={getDefaultRecipients(composeAction).cc}
                onClose={closeCompose}
                onSent={closeCompose}
              />
            )}
        </main>

        {/* Action items sidebar */}
        <EmailActionSidebar emailId={email.id} />
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete email"
      >
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          This email will be permanently removed from your inbox and your mailbox. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--destructive)] text-white hover:opacity-90 transition-opacity"
          >
            Delete
          </button>
        </div>
      </Modal>

      {/* Send to Page Modal */}
      {email && (
        <SendToPageModal
          open={showSendToPage}
          onClose={() => {
            setShowSendToPage(false);
            setSendToPageSelectedText(undefined);
          }}
          emails={[{
            id: email.id,
            sender: email.sender,
            subject: email.subject,
            received_at: email.received_at,
            recipients: email.recipients,
            has_attachments: (email.attachments_metadata?.length ?? 0) > 0,
            preview: email.body_plain_text?.slice(0, 200) ?? null,
            web_link: email.web_link,
            outlook_account_id: null,
            account_id: null,
            provider: "outlook" as const,
          }]}
          selectedText={sendToPageSelectedText}
          onSent={(title) => {
            toast({
              title: sendToPageSelectedText ? "Excerpt sent to page" : "Email sent to page",
              description: `Content sent to "${title}"`,
              variant: "success",
            });
          }}
        />
      )}
    </div>
  );
}
