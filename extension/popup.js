// Web Clipper — Popup Script

(function () {
  "use strict";

  const MAX_PREVIEW_LENGTH = 300;
  const MAX_TEXT_LENGTH = 50000; // client-side cap before sending
  const API_URL = "https://myopenbrain.com";

  // ── DOM Elements ──────────────────────────────────
  const setupScreen = document.getElementById("setup-screen");
  const clipScreen = document.getElementById("clip-screen");
  const apiKeyInput = document.getElementById("api-key-input");
  const saveKeyBtn = document.getElementById("save-key-btn");
  const setupError = document.getElementById("setup-error");
  const setupSuccess = document.getElementById("setup-success");
  const settingsBtn = document.getElementById("settings-btn");

  const titleInput = document.getElementById("title-input");
  const sourceUrl = document.getElementById("source-url");
  const tagsInput = document.getElementById("tags-input");
  const textPreview = document.getElementById("text-preview");
  const truncationNotice = document.getElementById("truncation-notice");
  const noContentMsg = document.getElementById("no-content-msg");
  const pageError = document.getElementById("page-error");
  const clipForm = document.getElementById("clip-form");
  const clipBtn = document.getElementById("clip-btn");

  const clipSuccess = document.getElementById("clip-success");
  const duplicateNotice = document.getElementById("duplicate-notice");
  const viewInBrainLink = document.getElementById("view-in-brain-link");
  const clipAnother = document.getElementById("clip-another-btn");
  const clipError = document.getElementById("clip-error");
  const errorText = document.getElementById("error-text");
  const retryBtn = document.getElementById("retry-btn");

  // ── State ─────────────────────────────────────────
  let extractedData = null;

  // ── Init ──────────────────────────────────────────
  init();

  async function init() {
    const apiKey = await getStoredApiKey();

    if (apiKey) {
      showClipScreen();
      extractPageContent();
    } else {
      showSetupScreen();
    }
  }

  // ── Storage Helpers ───────────────────────────────
  function getStoredApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["krisp_api_key"], (data) => {
        resolve(data.krisp_api_key || null);
      });
    });
  }

  function storeApiKey(apiKey) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ krisp_api_key: apiKey }, resolve);
    });
  }

  function clearApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(["krisp_api_key"], resolve);
    });
  }

  // ── Screen Management ─────────────────────────────
  function showSetupScreen() {
    setupScreen.classList.remove("hidden");
    clipScreen.classList.add("hidden");
  }

  function showClipScreen() {
    setupScreen.classList.add("hidden");
    clipScreen.classList.remove("hidden");
    clipForm.classList.remove("hidden");
    clipSuccess.classList.add("hidden");
    clipError.classList.add("hidden");
  }

  // ── Setup / Auth ──────────────────────────────────
  saveKeyBtn.addEventListener("click", async () => {
    const key = apiKeyInput.value.trim();

    setupError.classList.add("hidden");
    setupSuccess.classList.add("hidden");

    if (!key) {
      setupError.textContent = "Please enter your API key.";
      setupError.classList.remove("hidden");
      return;
    }

    saveKeyBtn.disabled = true;
    saveKeyBtn.textContent = "Connecting...";

    try {
      await storeApiKey(key);
      setupSuccess.classList.remove("hidden");
      setTimeout(() => {
        showClipScreen();
        extractPageContent();
      }, 800);
    } catch {
      setupError.textContent = "Failed to save API key.";
      setupError.classList.remove("hidden");
    } finally {
      saveKeyBtn.disabled = false;
      saveKeyBtn.textContent = "Save & Connect";
    }
  });

  settingsBtn.addEventListener("click", () => {
    apiKeyInput.value = "";
    showSetupScreen();
  });

  // ── Content Extraction ────────────────────────────
  async function extractPageContent() {
    pageError.classList.add("hidden");
    noContentMsg.classList.add("hidden");
    clipBtn.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.id) {
        pageError.textContent = "Cannot access the current tab.";
        pageError.classList.remove("hidden");
        clipForm.classList.add("hidden");
        return;
      }

      // Check for restricted pages
      const url = tab.url || "";
      if (
        url.startsWith("chrome://") ||
        url.startsWith("chrome-extension://") ||
        url.startsWith("chrome:") ||
        url.startsWith("about:") ||
        url.startsWith("edge://") ||
        url.includes("chrome.google.com/webstore")
      ) {
        pageError.textContent = "This page cannot be clipped.";
        pageError.classList.remove("hidden");
        clipForm.classList.add("hidden");
        return;
      }

      // Request content extraction from content script
      // Try sendMessage first; if content script isn't injected yet, inject it via scripting API
      let response;
      try {
        response = await chrome.tabs.sendMessage(tab.id, {
          type: "EXTRACT_CONTENT",
        });
      } catch {
        // Content script not injected — inject it now and retry
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          });
          response = await chrome.tabs.sendMessage(tab.id, {
            type: "EXTRACT_CONTENT",
          });
        } catch {
          pageError.textContent = "This page cannot be clipped.";
          pageError.classList.remove("hidden");
          clipForm.classList.add("hidden");
          return;
        }
      }

      if (!response || !response.success) {
        noContentMsg.textContent =
          response?.error || "Unable to extract content from this page.";
        noContentMsg.classList.remove("hidden");
        clipBtn.disabled = true;
        return;
      }

      extractedData = response;

      // Populate form
      titleInput.value = response.title;
      sourceUrl.textContent = response.url;

      // Truncate text for preview
      const previewText =
        response.text.length > MAX_PREVIEW_LENGTH
          ? response.text.slice(0, MAX_PREVIEW_LENGTH) + "..."
          : response.text;
      textPreview.textContent = previewText;

      if (response.text.length > MAX_TEXT_LENGTH) {
        truncationNotice.classList.remove("hidden");
      }

      if (response.isSelection) {
        truncationNotice.textContent = "Clipping selected text only.";
        truncationNotice.classList.remove("hidden");
      }

      clipBtn.disabled = false;
    } catch {
      pageError.textContent = "This page cannot be clipped.";
      pageError.classList.remove("hidden");
      clipForm.classList.add("hidden");
    }
  }

  // ── Clip Action ───────────────────────────────────
  clipBtn.addEventListener("click", async () => {
    if (!extractedData) return;

    clipBtn.disabled = true;
    clipBtn.classList.add("loading");
    clipBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle></svg> Saving...';

    const apiKey = await getStoredApiKey();

    if (!apiKey) {
      showSetupScreen();
      return;
    }

    // Build tags
    const rawTags = tagsInput.value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title: titleInput.value.trim() || extractedData.title || "Untitled",
      url: extractedData.url,
      domain: extractedData.domain,
      plain_text: extractedData.text.slice(0, MAX_TEXT_LENGTH),
      blocks: extractedData.blocks || [],
      tags: rawTags.slice(0, 10),
      clipped_at: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API_URL}/api/brain/clips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        errorText.textContent =
          "Authentication failed. Please update your API key in settings.";
        clipForm.classList.add("hidden");
        clipError.classList.remove("hidden");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error || `Server error (${res.status})`
        );
      }

      const data = await res.json();

      // Show success
      clipForm.classList.add("hidden");
      clipSuccess.classList.remove("hidden");

      // Set the "View in Brain" link — prefer the workspace page if available
      if (data.page_url) {
        viewInBrainLink.href = `${API_URL}${data.page_url}`;
        viewInBrainLink.textContent = "View Page";
      } else {
        viewInBrainLink.href = `${API_URL}/brain`;
        viewInBrainLink.textContent = "View in Brain";
      }

      if (data.duplicate) {
        duplicateNotice.classList.remove("hidden");
      }
    } catch (err) {
      clipForm.classList.add("hidden");
      errorText.textContent =
        err.message === "Failed to fetch"
          ? "Network error. Check your internet connection and try again."
          : err.message || "Failed to clip. Please try again.";
      clipError.classList.remove("hidden");
    }
  });

  // ── Retry / Clip Another ──────────────────────────
  clipAnother.addEventListener("click", () => {
    clipSuccess.classList.add("hidden");
    duplicateNotice.classList.add("hidden");
    clipForm.classList.remove("hidden");
    resetClipButton();
    extractPageContent();
  });

  retryBtn.addEventListener("click", () => {
    clipError.classList.add("hidden");
    clipForm.classList.remove("hidden");
    resetClipButton();
  });

  function resetClipButton() {
    clipBtn.disabled = false;
    clipBtn.classList.remove("loading");
    clipBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Clip to MyOpenBrain';
  }
})();
