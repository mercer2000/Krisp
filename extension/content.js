// Web Clipper — Content Script
// Extracts structured content from the active page as blocks

(function () {
  "use strict";

  // Elements to strip from cloning
  const STRIP_SELECTORS = [
    "script",
    "style",
    "noscript",
    "iframe",
    "nav",
    "footer",
    "header",
    "[role='navigation']",
    "[role='banner']",
    "[role='contentinfo']",
    ".nav",
    ".navbar",
    ".footer",
    ".sidebar",
    ".ad",
    ".ads",
    ".advertisement",
    ".cookie-banner",
    ".cookie-consent",
    ".popup",
    ".modal",
    "#cookie-banner",
    "#gdpr",
  ];

  // Block-level elements that should become their own blocks
  const BLOCK_ELEMENTS = new Set([
    "P",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "BLOCKQUOTE",
    "PRE",
    "UL",
    "OL",
    "LI",
    "HR",
    "DIV",
    "ARTICLE",
    "SECTION",
    "FIGURE",
  ]);

  // Max blocks to avoid huge payloads
  const MAX_BLOCKS = 80;

  // Listen for extraction requests from the popup
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "EXTRACT_CONTENT") {
      try {
        const result = extractContent();
        sendResponse(result);
      } catch (err) {
        sendResponse({
          success: false,
          error: err.message || "Extraction failed",
        });
      }
    }
    return true; // keep channel open for async response
  });

  function extractContent() {
    // Check for user selection first
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";

    if (selectedText && selectedText.length > 10) {
      // For selections, split into paragraph blocks
      const paragraphs = selectedText
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);

      const blocks = paragraphs.map((text) => ({
        type: "paragraph",
        content: { text },
      }));

      return {
        success: true,
        title: document.title || "",
        url: window.location.href,
        domain: window.location.hostname,
        text: selectedText,
        blocks: blocks.slice(0, MAX_BLOCKS),
        isSelection: true,
      };
    }

    // Full page extraction — clone DOM and strip boilerplate
    const clone = document.cloneNode(true);

    for (const sel of STRIP_SELECTORS) {
      const elements = clone.querySelectorAll(sel);
      for (const el of elements) {
        el.remove();
      }
    }

    // Try to find the main content area
    const mainContent =
      clone.querySelector("article") ||
      clone.querySelector("main") ||
      clone.querySelector('[role="main"]') ||
      clone.querySelector(".post-content") ||
      clone.querySelector(".article-content") ||
      clone.querySelector(".entry-content") ||
      clone.querySelector("#content") ||
      clone.body;

    if (!mainContent) {
      return {
        success: false,
        error: "Unable to extract content from this page",
      };
    }

    // Extract structured blocks from the DOM
    const blocks = [];
    extractBlocks(mainContent, blocks);

    // Also get flat text for the brain thought embedding
    let text = mainContent.textContent || "";
    text = text
      .replace(/\t/g, " ")
      .replace(/ {2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (blocks.length === 0 && (!text || text.length < 20)) {
      return {
        success: false,
        error: "Unable to extract meaningful content from this page",
      };
    }

    // If structured extraction yielded nothing useful, fall back to text splitting
    if (blocks.length === 0 && text.length >= 20) {
      const paragraphs = text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
      for (const p of paragraphs) {
        blocks.push({ type: "paragraph", content: { text: p } });
      }
    }

    // Post-process: deduplicate adjacent identical blocks and remove empty ones
    const cleaned = deduplicateBlocks(blocks);

    return {
      success: true,
      title: document.title || "",
      url: window.location.href,
      domain: window.location.hostname,
      text: text,
      blocks: cleaned.slice(0, MAX_BLOCKS),
      isSelection: false,
    };
  }

  // Inline elements that should NOT cause paragraph breaks
  const INLINE_ELEMENTS = new Set([
    "A",
    "ABBR",
    "ACRONYM",
    "B",
    "BDO",
    "BIG",
    "BR",
    "BUTTON",
    "CITE",
    "CODE",
    "DFN",
    "EM",
    "I",
    "IMG",
    "INPUT",
    "KBD",
    "LABEL",
    "MAP",
    "OBJECT",
    "OUTPUT",
    "Q",
    "SAMP",
    "SELECT",
    "SMALL",
    "SPAN",
    "STRONG",
    "SUB",
    "SUP",
    "TEXTAREA",
    "TIME",
    "TT",
    "U",
    "VAR",
    "WBR",
    "MARK",
    "S",
    "STRIKE",
    "DEL",
    "INS",
    "FONT",
  ]);

  /**
   * Check if an element is purely inline (contains no block-level descendants).
   */
  function isPurelyInline(el) {
    if (!el.children || el.children.length === 0) return true;
    for (const child of el.children) {
      if (!INLINE_ELEMENTS.has(child.tagName)) return false;
    }
    return true;
  }

  /**
   * Walk the DOM tree and produce structured blocks.
   * Each block has { type, content } matching workspace block types.
   */
  function extractBlocks(root, blocks) {
    for (const node of root.childNodes) {
      if (blocks.length >= MAX_BLOCKS) return;

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          // Merge with previous paragraph if possible
          const last = blocks[blocks.length - 1];
          if (last && last.type === "paragraph") {
            last.content.text += " " + text;
          } else {
            blocks.push({ type: "paragraph", content: { text } });
          }
        }
        continue;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const tag = node.tagName;

      // Skip line breaks
      if (tag === "BR") continue;

      // Skip elements with hidden attribute
      if (node.hasAttribute && node.hasAttribute("hidden")) continue;
      if (node.getAttribute && node.getAttribute("aria-hidden") === "true") continue;

      // Headings
      if (tag === "H1") {
        const text = getCleanText(node);
        if (text) blocks.push({ type: "heading_1", content: { text } });
        continue;
      }
      if (tag === "H2") {
        const text = getCleanText(node);
        if (text) blocks.push({ type: "heading_2", content: { text } });
        continue;
      }
      if (tag === "H3" || tag === "H4" || tag === "H5" || tag === "H6") {
        const text = getCleanText(node);
        if (text) blocks.push({ type: "heading_3", content: { text } });
        continue;
      }

      // Horizontal rule
      if (tag === "HR") {
        blocks.push({ type: "divider", content: {} });
        continue;
      }

      // Blockquote
      if (tag === "BLOCKQUOTE") {
        const text = getCleanText(node);
        if (text) blocks.push({ type: "quote", content: { text } });
        continue;
      }

      // Code blocks (pre > code)
      if (tag === "PRE") {
        const codeEl = node.querySelector("code");
        const text = (codeEl || node).textContent.trim();
        if (text) {
          const langClass = (codeEl || node).className || "";
          const langMatch = langClass.match(
            /(?:language-|lang-)(\w+)/
          );
          const language = langMatch ? langMatch[1] : "";
          blocks.push({
            type: "code",
            content: { text, language },
          });
        }
        continue;
      }

      // Lists — extract each LI as a list item block
      if (tag === "UL") {
        extractListItems(node, "bulleted_list", blocks);
        continue;
      }
      if (tag === "OL") {
        extractListItems(node, "numbered_list", blocks);
        continue;
      }

      // Paragraphs
      if (tag === "P") {
        const text = getCleanText(node);
        if (text) blocks.push({ type: "paragraph", content: { text } });
        continue;
      }

      // Figure — look for image or caption
      if (tag === "FIGURE") {
        const img = node.querySelector("img");
        const caption = node.querySelector("figcaption");
        if (img && img.src) {
          blocks.push({
            type: "image",
            content: {
              url: img.src,
              caption: caption ? getCleanText(caption) : "",
            },
          });
        } else {
          extractBlocks(node, blocks);
        }
        continue;
      }

      // Images (standalone)
      if (tag === "IMG") {
        const src = node.src || node.getAttribute("src");
        if (src) {
          blocks.push({
            type: "image",
            content: { url: src, caption: node.alt || "" },
          });
        }
        continue;
      }

      // Inline elements — merge into previous paragraph or start new one
      if (INLINE_ELEMENTS.has(tag)) {
        const text = getCleanText(node);
        if (text) {
          const last = blocks[blocks.length - 1];
          if (last && last.type === "paragraph") {
            last.content.text += " " + text;
          } else {
            blocks.push({ type: "paragraph", content: { text } });
          }
        }
        continue;
      }

      // Container elements (div, section, article, etc.)
      // If this element is purely inline (no block descendants), treat as a paragraph
      if (isPurelyInline(node)) {
        const text = getCleanText(node);
        if (text) {
          blocks.push({ type: "paragraph", content: { text } });
        }
      } else {
        // Has block-level children — recurse into them
        extractBlocks(node, blocks);
      }
    }
  }

  /**
   * Extract list items from UL/OL into blocks.
   */
  function extractListItems(listNode, blockType, blocks) {
    for (const li of listNode.querySelectorAll(":scope > li")) {
      if (blocks.length >= MAX_BLOCKS) return;
      const text = getCleanText(li);
      if (text) {
        blocks.push({ type: blockType, content: { text } });
      }
    }
  }

  /**
   * Get clean text from an element, using textContent to avoid
   * CSS pseudo-element artifacts (::before, ::after content).
   * Collapses whitespace into single spaces.
   */
  function getCleanText(el) {
    let text = el.textContent || "";
    text = text.replace(/\t/g, " ").replace(/ {2,}/g, " ").trim();
    return text;
  }

  /**
   * Remove duplicate adjacent blocks and blocks whose text is a
   * substring of the immediately following block (parent text captured
   * before child content was extracted).
   */
  function deduplicateBlocks(blocks) {
    const result = [];
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const text = (block.content && block.content.text) || "";

      // Skip empty text blocks
      if (!text && block.type !== "divider" && block.type !== "image") continue;

      // Skip if identical to previous block
      const prev = result[result.length - 1];
      if (prev && prev.type === block.type && prev.content.text === text) continue;

      // Skip if this block's text is fully contained in the next block
      // (happens when a parent DIV's text is captured, then its children are too)
      if (text && i + 1 < blocks.length) {
        const nextText = (blocks[i + 1].content && blocks[i + 1].content.text) || "";
        if (nextText && text.length > 20 && nextText.startsWith(text)) continue;
      }

      result.push(block);
    }
    return result;
  }
})();
