"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  Save,
  Copy,
  Check,
  Plus,
  X,
  MessageCircle,
  Send,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────

interface StarterButton {
  label: string;
  message: string;
}

interface WidgetConfig {
  agentName: string;
  agentRole: string;
  avatarUrl: string;
  welcomeMessage: string;
  starterButtons: StarterButton[];
  primaryColor: string;
  iconStyle: "modern" | "classic";
  bubbleSize: "small" | "medium" | "large";
  position: "bottom-right" | "bottom-left";
  zIndex: number;
  masterPrompt: string;
}

const DEFAULT_CONFIG: WidgetConfig = {
  agentName: "Support Agent",
  agentRole: "AI Assistant",
  avatarUrl: "",
  welcomeMessage: "Hi there! How can I help you today?",
  starterButtons: [],
  primaryColor: "#4f46e5",
  iconStyle: "modern",
  bubbleSize: "medium",
  position: "bottom-right",
  zIndex: 9999,
  masterPrompt: "",
};

const BUBBLE_SIZES: Record<string, number> = {
  small: 48,
  medium: 56,
  large: 64,
};

// ── Component ────────────────────────────────────────────

export function WidgetConfigClient() {
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);

  // ── Fetch config ───────────────────────────────────────

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support/config");
      if (res.ok) {
        const data = await res.json();
        // API returns { id, config: {...visualSettings}, masterPrompt: "...", updatedAt }
        const visual = data.config ?? {};
        setConfig({
          ...DEFAULT_CONFIG,
          ...visual,
          masterPrompt: data.masterPrompt ?? DEFAULT_CONFIG.masterPrompt,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ── Feedback toast ─────────────────────────────────────

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // ── Save config ────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      // Separate masterPrompt from visual config for the API
      const { masterPrompt, ...visualConfig } = config;
      const res = await fetch("/api/admin/support/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: visualConfig, masterPrompt }),
      });
      if (!res.ok) throw new Error("Save failed");
      setFeedback("Configuration saved successfully");
    } catch {
      setFeedback("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  // ── Starter button helpers ─────────────────────────────

  function addStarterButton() {
    if (config.starterButtons.length >= 4) return;
    setConfig((prev) => ({
      ...prev,
      starterButtons: [...prev.starterButtons, { label: "", message: "" }],
    }));
  }

  function removeStarterButton(index: number) {
    setConfig((prev) => ({
      ...prev,
      starterButtons: prev.starterButtons.filter((_, i) => i !== index),
    }));
  }

  function updateStarterButton(
    index: number,
    field: "label" | "message",
    value: string
  ) {
    setConfig((prev) => ({
      ...prev,
      starterButtons: prev.starterButtons.map((btn, i) =>
        i === index ? { ...btn, [field]: value } : btn
      ),
    }));
  }

  // ── Copy embed code ────────────────────────────────────

  function copyEmbedCode() {
    const code = `<script src="https://myopenbrain.com/widget/support-chat.js"></script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Field updater helper ───────────────────────────────

  function updateField<K extends keyof WidgetConfig>(
    key: K,
    value: WidgetConfig[K]
  ) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  // ── Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">
          Widget Configuration
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

  const bubbleSize = BUBBLE_SIZES[config.bubbleSize] ?? 56;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
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
            Widget Configuration
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Customize the support chat widget and preview changes in real-time.
          </p>
        </div>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] shadow-sm">
          {feedback}
        </div>
      )}

      {/* Main layout: config + preview */}
      <div className="flex gap-6 flex-col lg:flex-row">
        {/* ── Left: Configuration Form ──────────────────── */}
        <div className="flex-1 space-y-6">
          {/* Agent Identity */}
          <section className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Agent Identity
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={config.agentName}
                  onChange={(e) => updateField("agentName", e.target.value)}
                  placeholder="Support Agent"
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                  Agent Role
                </label>
                <input
                  type="text"
                  value={config.agentRole}
                  onChange={(e) => updateField("agentRole", e.target.value)}
                  placeholder="AI Assistant"
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Avatar URL
              </label>
              <input
                type="text"
                value={config.avatarUrl}
                onChange={(e) => updateField("avatarUrl", e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Welcome Message
              </label>
              <textarea
                value={config.welcomeMessage}
                onChange={(e) => updateField("welcomeMessage", e.target.value)}
                placeholder="Hi there! How can I help you today?"
                rows={3}
                className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
              />
            </div>
          </section>

          {/* Starter Buttons */}
          <section className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Starter Buttons
              </h2>
              <span className="text-xs text-[var(--muted-foreground)]">
                {config.starterButtons.length}/4
              </span>
            </div>

            {config.starterButtons.map((btn, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-md border border-[var(--border)] p-3"
              >
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={btn.label}
                    onChange={(e) =>
                      updateStarterButton(i, "label", e.target.value)
                    }
                    placeholder="Button label"
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                  />
                  <input
                    type="text"
                    value={btn.message}
                    onChange={(e) =>
                      updateStarterButton(i, "message", e.target.value)
                    }
                    placeholder="Message sent when clicked"
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                  />
                </div>
                <button
                  onClick={() => removeStarterButton(i)}
                  className="mt-1 rounded-md p-1 text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {config.starterButtons.length < 4 && (
              <button
                onClick={addStarterButton}
                className="flex items-center gap-1.5 rounded-md border border-dashed border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors w-full justify-center"
              >
                <Plus className="h-3 w-3" />
                Add Starter Button
              </button>
            )}
          </section>

          {/* Appearance */}
          <section className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Appearance
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) =>
                      updateField("primaryColor", e.target.value)
                    }
                    className="h-9 w-9 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) =>
                      updateField("primaryColor", e.target.value)
                    }
                    placeholder="#4f46e5"
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-mono text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                  Icon Style
                </label>
                <select
                  value={config.iconStyle}
                  onChange={(e) =>
                    updateField(
                      "iconStyle",
                      e.target.value as "modern" | "classic"
                    )
                  }
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                >
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                  Bubble Size
                </label>
                <select
                  value={config.bubbleSize}
                  onChange={(e) =>
                    updateField(
                      "bubbleSize",
                      e.target.value as "small" | "medium" | "large"
                    )
                  }
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                >
                  <option value="small">Small (48px)</option>
                  <option value="medium">Medium (56px)</option>
                  <option value="large">Large (64px)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                  Position
                </label>
                <select
                  value={config.position}
                  onChange={(e) =>
                    updateField(
                      "position",
                      e.target.value as "bottom-right" | "bottom-left"
                    )
                  }
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Z-Index
              </label>
              <input
                type="number"
                min={1}
                max={2147483647}
                value={config.zIndex}
                onChange={(e) =>
                  updateField("zIndex", Number(e.target.value) || 9999)
                }
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-600/30 sm:max-w-[200px]"
              />
            </div>
          </section>

          {/* Master Prompt */}
          <section className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Master Prompt
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              System-level instructions for the support agent. This is prepended
              to every conversation.
            </p>
            <textarea
              value={config.masterPrompt}
              onChange={(e) => updateField("masterPrompt", e.target.value)}
              placeholder="You are a helpful support agent for MyOpenBrain..."
              rows={8}
              className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-mono text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
            />
            <div className="text-xs text-[var(--muted-foreground)]">
              {config.masterPrompt.length.toLocaleString()} characters
            </div>
          </section>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Configuration"}
          </button>

          {/* ── Embed Code Section ───────────────────────── */}
          <section className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Embed Code
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Add this script tag to any page where you want the support chat
              widget to appear.
            </p>
            <div className="relative">
              <pre className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--muted)] p-4 text-sm font-mono text-[var(--foreground)]">
                {`<script src="https://myopenbrain.com/widget/support-chat.js"></script>`}
              </pre>
              <button
                onClick={copyEmbedCode}
                className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* ── Right: Live Preview ───────────────────────── */}
        <div className="lg:w-[380px] flex-shrink-0">
          <div className="sticky top-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Live Preview
              </h2>
              <button
                onClick={() => setPreviewOpen(!previewOpen)}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                {previewOpen ? "Show bubble only" : "Show chat panel"}
              </button>
            </div>

            {/* Preview container */}
            <div className="relative rounded-lg border border-[var(--border)] bg-[var(--muted)] p-6 overflow-hidden min-h-[480px]">
              {/* Mini chat panel */}
              {previewOpen && (
                <div
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-xl overflow-hidden"
                  style={{ maxWidth: 340 }}
                >
                  {/* Header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {config.avatarUrl ? (
                      <img
                        src={config.avatarUrl}
                        alt="avatar"
                        className="h-8 w-8 rounded-full object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                        {config.agentName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {config.agentName || "Agent"}
                      </p>
                      <p className="text-xs text-white/70">
                        {config.agentRole || "Assistant"}
                      </p>
                    </div>
                  </div>

                  {/* Messages area */}
                  <div className="px-4 py-4 space-y-3 min-h-[180px]">
                    {/* Welcome message */}
                    <div className="flex gap-2">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: config.primaryColor }}>
                        {config.agentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="rounded-lg rounded-tl-none bg-[var(--muted)] px-3 py-2 text-xs text-[var(--foreground)] max-w-[220px]">
                        {config.welcomeMessage || "Hello!"}
                      </div>
                    </div>

                    {/* Starter buttons */}
                    {config.starterButtons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-8">
                        {config.starterButtons
                          .filter((btn) => btn.label.trim())
                          .map((btn, i) => (
                            <span
                              key={i}
                              className="inline-block rounded-full border px-2.5 py-1 text-[10px] font-medium cursor-default"
                              style={{
                                borderColor: config.primaryColor + "40",
                                color: config.primaryColor,
                              }}
                            >
                              {btn.label}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Input bar */}
                  <div className="border-t border-[var(--border)] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 text-xs text-[var(--muted-foreground)]">
                        Type a message...
                      </div>
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        <Send className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bubble */}
              <div
                className={`absolute bottom-4 ${
                  config.position === "bottom-right" ? "right-4" : "left-4"
                }`}
              >
                <div
                  className="flex items-center justify-center rounded-full shadow-lg text-white cursor-pointer hover:scale-105 transition-transform"
                  style={{
                    width: bubbleSize,
                    height: bubbleSize,
                    backgroundColor: config.primaryColor,
                  }}
                >
                  <MessageCircle
                    className={
                      config.iconStyle === "classic" ? "h-6 w-6" : "h-5 w-5"
                    }
                    strokeWidth={config.iconStyle === "classic" ? 2 : 1.5}
                  />
                </div>
              </div>
            </div>

            <p className="mt-2 text-center text-[10px] text-[var(--muted-foreground)]">
              Preview updates in real-time as you change settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
