"use client";

import { useState, useEffect, useCallback } from "react";
import { EXTENSION_CONFIG } from "@/lib/extension/config";

// ── Icons ──────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
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
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

// ── Browser Detection ──────────────────────────────────

type BrowserType = "chrome" | "edge" | "firefox" | "safari" | "unknown";

function detectBrowser(): BrowserType {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "chrome";
  if (ua.includes("Firefox/")) return "firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "safari";
  return "unknown";
}

// ── Step Component ─────────────────────────────────────

function InstallStep({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div className="flex-1 min-w-0 pb-6">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1.5">{title}</h3>
        <div className="text-sm text-[var(--muted-foreground)] space-y-2">{children}</div>
      </div>
    </div>
  );
}

// ── Troubleshooting Accordion ──────────────────────────

const TROUBLESHOOTING_ITEMS = [
  {
    q: "Extension disappears after Chrome restarts",
    a: 'This can happen on managed Chrome installations (e.g., Chromebook kiosk mode) or if Chrome is set to clear extensions on restart. Open chrome://extensions and check if the extension is listed as "Removed" or disabled. Re-load the unpacked folder if needed.',
  },
  {
    q: '"Manifest file is missing or unreadable" error',
    a: "Make sure you unzipped the downloaded file. Select the folder that directly contains manifest.json — not a parent folder. If you see a nested folder inside the unzipped archive, use the inner folder.",
  },
  {
    q: "API key not recognized or 401 errors",
    a: 'Verify the API key in the extension popup matches the key from your Integrations page. Keys start with "zk_". Generate a new one if needed. Also check your Krisp URL is correct (include https://).',
  },
  {
    q: '"Load unpacked" button is not visible',
    a: "Make sure Developer Mode is toggled on (top-right corner of chrome://extensions). The toggle must be in the ON position for the Load unpacked button to appear.",
  },
  {
    q: "Extension works but clips are not appearing in Brain",
    a: "Check the network tab in the extension popup (right-click > Inspect Popup) for failed API calls. The most common issue is an incorrect Krisp URL. Make sure it includes the full URL with https:// and no trailing slash.",
  },
];

function TroubleshootingSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {TROUBLESHOOTING_ITEMS.map((item, idx) => (
        <div key={idx} className="border border-[var(--border)] rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-[var(--accent)]/50 transition-colors"
          >
            <ChevronDown open={openIdx === idx} />
            <span className="text-sm font-medium text-[var(--foreground)]">{item.q}</span>
          </button>
          {openIdx === idx && (
            <div className="px-4 pb-3 text-sm text-[var(--muted-foreground)] border-t border-[var(--border)] pt-3">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────

export function ExtensionsClient({ userId }: { userId: string }) {
  const [browser, setBrowser] = useState<BrowserType>("unknown");
  const [downloading, setDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      // Track the download
      await fetch("/api/downloads/extension/track", { method: "POST" });

      // Trigger file download
      const link = document.createElement("a");
      link.href = EXTENSION_CONFIG.downloadPath;
      link.download = EXTENSION_CONFIG.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadComplete(true);
    } catch {
      // Download tracking failed but continue with download anyway
      const link = document.createElement("a");
      link.href = EXTENSION_CONFIG.downloadPath;
      link.download = EXTENSION_CONFIG.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadComplete(true);
    } finally {
      setDownloading(false);
    }
  }, []);

  const handleTestConnection = useCallback(async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      // We test by calling the Brain clips endpoint with a HEAD-like GET
      // If the API key is stored in the extension, it would call back to us.
      // From the app side, we can verify the clips API is accessible.
      const res = await fetch("/api/brain/clips?test=1");
      if (res.ok || res.status === 200) {
        setConnectionResult({ ok: true, message: "API endpoint is reachable. Open the extension popup and verify it connects with your API key." });
      } else {
        setConnectionResult({ ok: false, message: `API returned status ${res.status}. Check your setup.` });
      }
    } catch {
      setConnectionResult({ ok: false, message: "Could not reach the API. Check that the application is running." });
    } finally {
      setTestingConnection(false);
    }
  }, []);

  const isChromiumBased = browser === "chrome" || browser === "edge";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">Extensions</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Install and configure the Krisp browser extension to clip web content directly into your Brain.
        </p>
      </div>

      {/* Browser Warning */}
      {!isChromiumBased && browser !== "unknown" && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10">
          <AlertTriangleIcon />
          <div className="text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-300">
              {browser === "firefox"
                ? "Firefox is not supported"
                : browser === "safari"
                  ? "Safari is not supported"
                  : "Your browser may not be supported"}
            </p>
            <p className="text-amber-600 dark:text-amber-400 mt-1">
              The Web Clipper is a Chrome extension. It works natively in Google Chrome and also in Microsoft Edge
              (which supports unpacked Chrome extensions). Other browsers are not currently supported.
            </p>
          </div>
        </div>
      )}

      {browser === "edge" && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-blue-600 dark:text-blue-400">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Microsoft Edge detected</p>
            <p className="mt-1">
              Edge supports Chrome extensions. Follow the same steps below, but navigate to{" "}
              <code className="px-1.5 py-0.5 rounded bg-blue-500/10 font-mono text-xs">edge://extensions</code>{" "}
              instead of chrome://extensions. Enable &quot;Developer mode&quot; in the bottom-left corner.
            </p>
          </div>
        </div>
      )}

      {/* Extension Card */}
      <div className="border border-[var(--border)] rounded-xl bg-[var(--card)] overflow-hidden">
        <div className="p-5 flex items-center gap-4">
          {/* Extension icon */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
              <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
              <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[var(--foreground)]">{EXTENSION_CONFIG.name}</h2>
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--primary)]/10 text-[var(--primary)]">
                v{EXTENSION_CONFIG.version}
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              Clip web pages and selected text directly into your Open Brain knowledge system.
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Chrome Extension (Manifest V{EXTENSION_CONFIG.manifestVersion}) &middot; Updated {EXTENSION_CONFIG.updatedAt}
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
          >
            {downloadComplete ? <CheckCircleIcon /> : <DownloadIcon />}
            {downloading ? "Downloading..." : downloadComplete ? "Downloaded" : "Download Extension"}
          </button>
        </div>
      </div>

      {/* Installation Steps */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
          Installation Guide
        </h2>

        <div className="pt-4 space-y-0">
          <InstallStep number={1} title="Download the Extension">
            <p>
              Click the <strong>&quot;Download Extension&quot;</strong> button above to save the ZIP file to your computer.
            </p>
          </InstallStep>

          <InstallStep number={2} title="Unzip the Downloaded File">
            <p>
              Extract the ZIP to a <strong>permanent folder</strong> on your machine (e.g.,{" "}
              <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] font-mono text-xs">
                C:\Extensions\krisp-web-clipper
              </code>{" "}
              on Windows or{" "}
              <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] font-mono text-xs">
                ~/Extensions/krisp-web-clipper
              </code>{" "}
              on macOS/Linux).
            </p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 mt-2">
              <AlertTriangleIcon />
              <span>Do not delete or move this folder after loading the extension — Chrome reads files from it at runtime.</span>
            </div>
          </InstallStep>

          <InstallStep number={3} title="Open Chrome Extensions Page">
            <p>
              Open Chrome and navigate to{" "}
              <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] font-mono text-xs">chrome://extensions</code>
              {" "}in the address bar.
            </p>
            {browser === "edge" && (
              <p className="mt-1">
                For Edge, use{" "}
                <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] font-mono text-xs">edge://extensions</code>{" "}
                instead.
              </p>
            )}
          </InstallStep>

          <InstallStep number={4} title="Enable Developer Mode">
            <p>
              Toggle the <strong>&quot;Developer mode&quot;</strong> switch in the top-right corner of the extensions page.
              {browser === "edge" && " (In Edge, it's in the bottom-left corner.)"}
            </p>
            <div className="mt-2 p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <span>Developer mode</span>
                </div>
                <div className="w-10 h-5 rounded-full bg-[var(--primary)] relative">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white" />
                </div>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                The toggle should look like this (blue/on position). Three new buttons will appear: &quot;Load unpacked&quot;, &quot;Pack extension&quot;, and &quot;Update&quot;.
              </p>
            </div>
          </InstallStep>

          <InstallStep number={5} title='Click "Load unpacked"'>
            <p>
              Click the <strong>&quot;Load unpacked&quot;</strong> button that appeared after enabling Developer mode.
              Browse to and select the folder where you unzipped the extension — it should contain the{" "}
              <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] font-mono text-xs">manifest.json</code> file.
            </p>
          </InstallStep>

          <InstallStep number={6} title="Pin the Extension">
            <p>
              Click the puzzle-piece icon in Chrome&apos;s toolbar, find <strong>&quot;{EXTENSION_CONFIG.name}&quot;</strong>, and click the pin icon to keep it visible in your toolbar for quick access.
            </p>
          </InstallStep>
        </div>
      </div>

      {/* Post-Install: API Key Setup */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
          Connect to Your Account
        </h2>

        <div className="border border-[var(--border)] rounded-xl bg-[var(--card)] p-5 space-y-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            The extension uses a <strong>Personal API Key</strong> to securely connect to your Krisp account. You&apos;ll need to enter this key in the extension popup the first time you use it.
          </p>

          <div className="flex items-center gap-3">
            <a
              href="/admin/integrations"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              <KeyIcon />
              Manage API Keys
              <ExternalLinkIcon />
            </a>
            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
            >
              {testingConnection ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
              {testingConnection ? "Testing..." : "Test API Endpoint"}
            </button>
          </div>

          {connectionResult && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg text-xs ${
                connectionResult.ok
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300"
              }`}
            >
              {connectionResult.ok ? <CheckCircleIcon /> : <AlertTriangleIcon />}
              <span>{connectionResult.message}</span>
            </div>
          )}

          <div className="text-sm text-[var(--muted-foreground)] space-y-2 pt-2">
            <p className="font-medium text-[var(--foreground)]">How it works:</p>
            <ol className="list-decimal list-inside space-y-1.5 ml-1">
              <li>Click the Krisp extension icon in your Chrome toolbar</li>
              <li>Enter your Krisp instance URL (e.g., <code className="px-1 py-0.5 rounded bg-[var(--secondary)] font-mono text-xs">https://your-app.vercel.app</code>)</li>
              <li>Paste your Personal API Key (starts with <code className="px-1 py-0.5 rounded bg-[var(--secondary)] font-mono text-xs">zk_</code>)</li>
              <li>Click &quot;Save &amp; Connect&quot; — you&apos;re ready to clip!</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
          Troubleshooting
        </h2>
        <TroubleshootingSection />
      </div>

      {/* Chrome Version Notice */}
      <div className="text-xs text-[var(--muted-foreground)] p-4 rounded-xl bg-[var(--secondary)] border border-[var(--border)]">
        <p>
          <strong>System requirements:</strong> Google Chrome {EXTENSION_CONFIG.minChromeVersion}+ or Microsoft Edge {EXTENSION_CONFIG.minChromeVersion}+ with Manifest V{EXTENSION_CONFIG.manifestVersion} support.
          If you encounter a &quot;manifest version&quot; error, please{" "}
          <a
            href="https://support.google.com/chrome/answer/95414"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] underline underline-offset-2"
          >
            update Chrome
          </a>{" "}
          to the latest version.
        </p>
      </div>
    </div>
  );
}
