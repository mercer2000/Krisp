"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Globe,
  FileText,
  Upload,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Link as LinkIcon,
  X,
  Save,
  Pencil,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────

type IngestionType = "url" | "text" | "file";

interface KBSource {
  id: string;
  sourceType: "url" | "text" | "pdf" | "csv" | "sitemap";
  sourceLabel: string | null;
  sourceUrl: string | null;
  status: "queued" | "processing" | "complete" | "failed";
  chunkCount: number;
  enabled: boolean;
  errorMessage: string | null;
  createdAt: string;
}

interface KBChunk {
  id: string;
  content: string;
  enabled: boolean;
  createdAt: string;
}

const STATUS_STYLES: Record<
  KBSource["status"],
  { bg: string; text: string; label: string }
> = {
  queued: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-600 dark:text-yellow-400",
    label: "Queued",
  },
  processing: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    label: "Processing",
  },
  complete: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "Complete",
  },
  failed: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    label: "Failed",
  },
};

const TYPE_ICONS: Record<string, typeof Globe> = {
  url: Globe,
  text: FileText,
  pdf: Upload,
  csv: Upload,
  sitemap: LinkIcon,
};

// ── Component ────────────────────────────────────────────

export function KnowledgeBaseClient() {
  const [sources, setSources] = useState<KBSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingestionType, setIngestionType] = useState<IngestionType>("url");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Chunk viewer state
  const [selectedSource, setSelectedSource] = useState<KBSource | null>(null);
  const [chunks, setChunks] = useState<KBChunk[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [savingChunkId, setSavingChunkId] = useState<string | null>(null);
  const [deletingChunkId, setDeletingChunkId] = useState<string | null>(null);

  // ── URL fields
  const [url, setUrl] = useState("");
  const [crawlAll, setCrawlAll] = useState(false);
  const [crawlDepth, setCrawlDepth] = useState(2);

  // ── Text fields
  const [textContent, setTextContent] = useState("");
  const [textLabel, setTextLabel] = useState("");

  // ── File fields
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ── Fetch sources ──────────────────────────────────────

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support/kb");
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // ── Auto-refresh while any source is queued/processing ─

  useEffect(() => {
    const hasActive = sources.some(
      (s) => s.status === "queued" || s.status === "processing"
    );

    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(fetchSources, 5000);
    } else if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [sources, fetchSources]);

  // ── Feedback toast ─────────────────────────────────────

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // ── Submit handlers ────────────────────────────────────

  async function handleSubmitUrl() {
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/support/kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "url",
          url: url.trim(),
          crawl: crawlAll,
          crawlDepth,
        }),
      });
      if (!res.ok) throw new Error("Failed to ingest URL");
      setUrl("");
      setCrawlAll(false);
      setCrawlDepth(2);
      setFeedback("URL submitted for ingestion");
      await fetchSources();
    } catch {
      setFeedback("Failed to submit URL");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitText() {
    if (!textContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/support/kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "text",
          content: textContent.trim(),
          label: textLabel.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to ingest text");
      setTextContent("");
      setTextLabel("");
      setFeedback("Text submitted for ingestion");
      await fetchSources();
    } catch {
      setFeedback("Failed to submit text");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitFile() {
    if (!selectedFile) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Determine file type from extension
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      let fileType = "pdf";
      if (ext === "csv") fileType = "csv";
      else if (ext === "xml") fileType = "sitemap";
      formData.append("type", fileType);

      const res = await fetch("/api/admin/support/kb/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload file");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFeedback("File uploaded for ingestion");
      await fetchSources();
    } catch {
      setFeedback("Failed to upload file");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Toggle enabled ─────────────────────────────────────

  async function handleToggleEnabled(id: string, enabled: boolean) {
    try {
      const res = await fetch(`/api/admin/support/kb/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        setSources((prev) =>
          prev.map((s) => (s.id === id ? { ...s, enabled } : s))
        );
      }
    } catch {
      setFeedback("Failed to update source");
    }
  }

  // ── Delete source ──────────────────────────────────────

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/support/kb/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSources((prev) => prev.filter((s) => s.id !== id));
        if (selectedSource?.id === id) {
          setSelectedSource(null);
          setChunks([]);
        }
        setFeedback("Source deleted");
      }
    } catch {
      setFeedback("Failed to delete source");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Chunk handlers ─────────────────────────────────────

  async function fetchChunks(source: KBSource) {
    setSelectedSource(source);
    setChunksLoading(true);
    setEditingChunkId(null);
    try {
      const res = await fetch(`/api/admin/support/kb/${source.id}/chunks`);
      if (res.ok) {
        const data = await res.json();
        setChunks(data.chunks ?? []);
      }
    } catch {
      setFeedback("Failed to load chunks");
    } finally {
      setChunksLoading(false);
    }
  }

  function startEditChunk(chunk: KBChunk) {
    setEditingChunkId(chunk.id);
    setEditContent(chunk.content);
  }

  function cancelEditChunk() {
    setEditingChunkId(null);
    setEditContent("");
  }

  async function saveChunkEdit(chunkId: string) {
    if (!selectedSource || !editContent.trim()) return;
    setSavingChunkId(chunkId);
    try {
      const res = await fetch(
        `/api/admin/support/kb/${selectedSource.id}/chunks/${chunkId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent.trim() }),
        }
      );
      if (res.ok) {
        setChunks((prev) =>
          prev.map((c) =>
            c.id === chunkId ? { ...c, content: editContent.trim() } : c
          )
        );
        setEditingChunkId(null);
        setEditContent("");
        setFeedback("Chunk updated & re-embedded");
      } else {
        setFeedback("Failed to save chunk");
      }
    } catch {
      setFeedback("Failed to save chunk");
    } finally {
      setSavingChunkId(null);
    }
  }

  async function toggleChunkEnabled(chunkId: string, enabled: boolean) {
    if (!selectedSource) return;
    try {
      const res = await fetch(
        `/api/admin/support/kb/${selectedSource.id}/chunks/${chunkId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        }
      );
      if (res.ok) {
        setChunks((prev) =>
          prev.map((c) => (c.id === chunkId ? { ...c, enabled } : c))
        );
      }
    } catch {
      setFeedback("Failed to update chunk");
    }
  }

  async function deleteChunk(chunkId: string) {
    if (!selectedSource) return;
    setDeletingChunkId(chunkId);
    try {
      const res = await fetch(
        `/api/admin/support/kb/${selectedSource.id}/chunks/${chunkId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setChunks((prev) => prev.filter((c) => c.id !== chunkId));
        // Update source chunk count locally
        setSources((prev) =>
          prev.map((s) =>
            s.id === selectedSource.id
              ? { ...s, chunkCount: s.chunkCount - 1 }
              : s
          )
        );
        setFeedback("Chunk deleted");
      }
    } catch {
      setFeedback("Failed to delete chunk");
    } finally {
      setDeletingChunkId(null);
    }
  }

  // ── Tab UI data ────────────────────────────────────────

  const tabs: { key: IngestionType; label: string; icon: typeof Globe }[] = [
    { key: "url", label: "URL", icon: Globe },
    { key: "text", label: "Text", icon: FileText },
    { key: "file", label: "File Upload", icon: Upload },
  ];

  // ── Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">
          Knowledge Base
        </h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-[var(--muted)]"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Chunk detail view ──────────────────────────────────

  if (selectedSource) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedSource(null);
              setChunks([]);
              setEditingChunkId(null);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-[var(--foreground)] truncate">
              {selectedSource.sourceLabel || selectedSource.sourceUrl || "Text source"}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {chunks.length} chunks &middot;{" "}
              {selectedSource.sourceType} source &middot;{" "}
              {new Date(selectedSource.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => fetchChunks(selectedSource)}
            className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        {/* Feedback toast */}
        {feedback && (
          <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] shadow-sm">
            {feedback}
          </div>
        )}

        {/* Chunks list */}
        {chunksLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg bg-[var(--muted)]"
              />
            ))}
          </div>
        ) : chunks.length === 0 ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            No chunks found for this source.
          </div>
        ) : (
          <div className="space-y-3">
            {chunks.map((chunk, idx) => (
              <div
                key={chunk.id}
                className={`rounded-lg border bg-[var(--background)] transition-colors ${
                  chunk.enabled
                    ? "border-[var(--border)]"
                    : "border-[var(--border)] opacity-50"
                }`}
              >
                {/* Chunk header */}
                <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2">
                  <span className="text-xs font-mono font-medium text-[var(--muted-foreground)]">
                    Chunk {idx + 1}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    &middot; {chunk.content.length} chars
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)] truncate font-mono opacity-50">
                    {chunk.id.slice(0, 8)}
                  </span>

                  <div className="flex-1" />

                  {/* Edit button */}
                  {editingChunkId !== chunk.id && (
                    <button
                      onClick={() => startEditChunk(chunk)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                      title="Edit chunk"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  )}

                  {/* Enabled toggle */}
                  <button
                    onClick={() =>
                      toggleChunkEnabled(chunk.id, !chunk.enabled)
                    }
                    className={`relative flex-shrink-0 h-5 w-9 rounded-full transition-colors ${
                      chunk.enabled ? "bg-indigo-600" : "bg-[var(--muted)]"
                    }`}
                    title={chunk.enabled ? "Disable chunk" : "Enable chunk"}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                        chunk.enabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteChunk(chunk.id)}
                    disabled={deletingChunkId === chunk.id}
                    className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Delete chunk"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Chunk content */}
                <div className="p-4">
                  {editingChunkId === chunk.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={Math.min(
                          20,
                          Math.max(4, editContent.split("\n").length + 2)
                        )}
                        className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveChunkEdit(chunk.id)}
                          disabled={
                            savingChunkId === chunk.id ||
                            !editContent.trim() ||
                            editContent.trim() === chunk.content
                          }
                          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          <Save className="h-3 w-3" />
                          {savingChunkId === chunk.id
                            ? "Saving & re-embedding..."
                            : "Save & Re-embed"}
                        </button>
                        <button
                          onClick={cancelEditChunk}
                          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                        {editContent.trim() !== chunk.content && (
                          <span className="text-xs text-amber-500">
                            Unsaved changes
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm text-[var(--foreground)] leading-relaxed">
                      {chunk.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Sources list view ──────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <a
          href="/admin/support"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Knowledge Base
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Add content sources to train the support agent.
          </p>
        </div>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] shadow-sm">
          {feedback}
        </div>
      )}

      {/* ── Ingestion Form ───────────────────────────────── */}
      <div className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--background)] p-6">
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
          Add Source
        </h2>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg border border-[var(--border)] p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setIngestionType(tab.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  ingestionType === tab.key
                    ? "bg-indigo-600 text-white"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* URL form */}
        {ingestionType === "url" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.example.com/getting-started"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={crawlAll}
                  onChange={(e) => setCrawlAll(e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                Crawl all pages
              </label>
              {crawlAll && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--muted-foreground)]">
                    Depth:
                  </label>
                  <select
                    value={crawlDepth}
                    onChange={(e) => setCrawlDepth(Number(e.target.value))}
                    className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)]"
                  >
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button
              onClick={handleSubmitUrl}
              disabled={submitting || !url.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {submitting ? "Submitting..." : "Ingest URL"}
            </button>
          </div>
        )}

        {/* Text form */}
        {ingestionType === "text" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Label (optional)
              </label>
              <input
                type="text"
                value={textLabel}
                onChange={(e) => setTextLabel(e.target.value)}
                placeholder="e.g. FAQ, Product Overview"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Content
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste your knowledge base content here..."
                rows={8}
                className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
              />
            </div>
            <button
              onClick={handleSubmitText}
              disabled={submitting || !textContent.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {submitting ? "Submitting..." : "Ingest Text"}
            </button>
          </div>
        )}

        {/* File form */}
        {ingestionType === "file" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Upload File (PDF, CSV, or XML Sitemap)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.xml"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] file:mr-3 file:rounded-md file:border-0 file:bg-indigo-600/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-indigo-600"
              />
            </div>
            {selectedFile && (
              <p className="text-xs text-[var(--muted-foreground)]">
                Selected: {selectedFile.name} (
                {(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
            <button
              onClick={handleSubmitFile}
              disabled={submitting || !selectedFile}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              {submitting ? "Uploading..." : "Upload & Ingest"}
            </button>
          </div>
        )}
      </div>

      {/* ── Sources List ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Sources ({sources.length})
          </h2>
          <button
            onClick={fetchSources}
            className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        {sources.length === 0 ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            No sources yet. Add a URL, text, or file above to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => {
              const status = STATUS_STYLES[source.status];
              const Icon = TYPE_ICONS[source.sourceType] ?? FileText;
              return (
                <div
                  key={source.id}
                  className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 group"
                >
                  {/* Type icon */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[var(--muted)]">
                    <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                  </div>

                  {/* Label / URL — clickable to view chunks */}
                  <button
                    onClick={() => fetchChunks(source)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium text-[var(--foreground)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {source.sourceLabel || source.sourceUrl || "Text source"}
                    </p>
                    {source.sourceUrl && source.sourceLabel && (
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        {source.sourceUrl}
                      </p>
                    )}
                    {source.errorMessage && (
                      <p className="mt-0.5 truncate text-xs text-red-500">
                        {source.errorMessage}
                      </p>
                    )}
                  </button>

                  {/* Status badge */}
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
                  >
                    {status.label}
                  </span>

                  {/* Chunk count — clickable */}
                  <button
                    onClick={() => fetchChunks(source)}
                    className="flex-shrink-0 text-xs tabular-nums text-[var(--muted-foreground)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {source.chunkCount} chunks
                  </button>

                  {/* View chunks arrow */}
                  <button
                    onClick={() => fetchChunks(source)}
                    className="flex-shrink-0 rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    title="View & edit chunks"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Enabled toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleEnabled(source.id, !source.enabled);
                    }}
                    className={`relative flex-shrink-0 h-5 w-9 rounded-full transition-colors ${
                      source.enabled ? "bg-indigo-600" : "bg-[var(--muted)]"
                    }`}
                    title={source.enabled ? "Disable source" : "Enable source"}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                        source.enabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(source.id);
                    }}
                    disabled={deletingId === source.id}
                    className="flex-shrink-0 rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Delete source"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Processing indicator */}
        {sources.some(
          (s) => s.status === "queued" || s.status === "processing"
        ) && (
          <p className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Auto-refreshing every 5 seconds while sources are processing...
          </p>
        )}
      </div>
    </div>
  );
}
