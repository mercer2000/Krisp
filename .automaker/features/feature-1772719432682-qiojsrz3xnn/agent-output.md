

Let me understand the issue - web clips are being stored as plain text with no structure, just a wall of concatenated text. Let me look at the current implementation to see how content is being extracted and stored.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\extension\\content.js"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\extension\\popup.js"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\brain\\clips\\route.ts"
}
Now I see the issue. The content extraction in `content.js` extracts structured blocks properly, the popup sends them, and the API route creates workspace page blocks from them. But looking at the example text in the follow-up — `% Partner Network RebateDrive Predictable,High-Intent Leads...` — this looks like a page where every text node is being merged into one giant paragraph. 

The problem is in the `extractBlocks` function: when a `DIV` has no block-level children, it treats the whole DIV's inner text as a single paragraph. But many modern sites use nested `DIV`s and `SPAN`s for layout where none contain traditional block elements like `P`, `H1`, etc. This means the function finds no block children and collapses everything into one paragraph.

Let me also check how the workspace page renders these blocks.

🔧 Tool: Task
Input: {
  "description": "Find workspace page rendering",
  "subagent_type": "Explore",
  "prompt": "Find and examine how workspace pages render blocks in the Krisp app. Look for:\n1. The workspace page component (likely under app/(app)/workspace/)\n2. How blocks are rendered (block renderer component)\n3. How different block types (paragraph, heading_1, heading_2, bulleted_list, etc.) are displayed\n\nSearch thoroughly in: app/(app)/workspace/, components/, and any block-related files. I need to understand the rendering side to see if the blocks are being displayed correctly as structured content (with headings, lists, etc.) or just as plain text paragraphs."
}

🔧 Tool: Glob
Input: {
  "pattern": "**/workspace/**/*.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/workspace/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/components/*block*.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/components/*block*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/components/*Block*.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/lib/**/*block*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\workspace\\[workspaceId]\\[pageId]\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\workspace\\[workspaceId]\\page.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/components/**/*.tsx",
  "path": "C:\\Code\\Krisp\\components"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\pages\\editor\\BlockEditor.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/pages/editor/*.tsx",
  "path": "C:\\Code\\Krisp\\components"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/pages/**/*.tsx",
  "path": "C:\\Code\\Krisp\\components"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/types/**/*.ts",
  "path": "C:\\Code\\Krisp"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/types.ts",
  "path": "C:\\Code\\Krisp"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\pages\\PageHeader.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\" -name \"index.ts\" -path \"*/types/*\" -not -path \"*/node_modules/*\" -not -path \"*/.next/*\" -not -path \"*/.worktrees/*\" 2>/dev/null | head -20"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\" -maxdepth 2 -name \"*.ts\" -path \"*/types*\" -not -path \"*/node_modules/*\" 2>/dev/null"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\index.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "BlockRenderer|readOnly|viewMode|display",
  "path": "C:\\Code\\Krisp\\components\\pages",
  "type": "tsx",
  "output_mode": "files_with_matches"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\pages\\editor\\SlashCommandMenu.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\pages\\editor\\BlockActionMenu.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\\lib\" -name \"*block*\" -o -name \"*page*\" | grep -v node_modules | head -20"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\\lib\\hooks\" -name \"*\" -not -path \"*/node_modules/*\" 2>/dev/null | head -30"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/hooks/**/*.ts",
  "path": "C:\\Code\\Krisp\\lib"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useBlocks.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\usePages.ts"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\\app\\api\\pages\" -name \"*.ts\" -not -path \"*/node_modules/*\" 2>/dev/null"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/api/pages/**/*.ts",
  "path": "C:\\Code\\Krisp\\app"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\pages\\[pageId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\pages\\[pageId]\\blocks\\route.ts"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\\app\\api\\blocks\" -name \"*.ts\" -not -path \"*/node_modules/*\" 2>/dev/null"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/api/blocks/**/*.ts",
  "path": "C:\\Code\\Krisp\\app"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\blocks\\[id]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}
Good - the workspace renders blocks properly with type-specific styles. The issue is that the content extraction in `content.js` is producing mostly flat `paragraph` blocks from modern websites that use `div`-heavy markup without traditional semantic HTML.

Looking at the example text: `% Partner Network RebateDrive Predictable,High-Intent Leads...` — this is all concatenated text with no whitespace or structure between what should be separate sections, headings, and paragraphs. The `%` at the start suggests some CSS pseudo-element content leaking through.

The core problem is in `extractBlocks`: when it encounters a `DIV` with no block-level children, it dumps the entire `innerText` as one paragraph. On modern marketing sites, deeply nested `DIV > DIV > SPAN` structures with no `P`/`H1` tags cause everything to collapse.

Let me fix the content extraction to better handle these cases.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix content.js extractBlocks to handle div-heavy sites with better paragraph splitting",
      "status": "in_progress",
      "activeForm": "Fixing content extraction for div-heavy modern sites"
    },
    {
      "content": "Ensure text nodes separated by block-level divs produce separate paragraphs",
      "status": "pending",
      "activeForm": "Ensuring proper paragraph separation from nested divs"
    },
    {
      "content": "Filter out CSS pseudo-element artifacts like % symbols",
      "status": "pending",
      "activeForm": "Filtering CSS pseudo-element artifacts"
    }
  ]
}
The root issues I can see:

1. **DIV-with-no-block-children collapses everything** — When a `DIV` contains only `SPAN`s and text, `getInnerText` grabs the entire subtree as one paragraph. But on many sites, sibling `DIV`s each represent visually separate sections even without `P` tags.

2. **`innerText` pulls in CSS-generated content** — The `%` in the output is from CSS `::before`/`::after` pseudo-elements (`innerText` includes these).

3. **No newline-based splitting** — When a DIV's innerText contains natural line breaks (from sub-elements rendering on separate lines), those aren't being used to split into separate paragraphs.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\extension\\content.js",
  "old_string": "  /**\n   * Walk the DOM tree and produce structured blocks.\n   * Each block has { type, content } matching workspace block types.\n   */\n  function extractBlocks(root, blocks) {\n    for (const node of root.childNodes) {\n      if (blocks.length >= MAX_BLOCKS) return;\n\n      if (node.nodeType === Node.TEXT_NODE) {\n        const text = node.textContent.trim();\n        if (text) {\n          // Merge with previous paragraph if possible\n          const last = blocks[blocks.length - 1];\n          if (last && last.type === \"paragraph\") {\n            last.content.text += \" \" + text;\n          } else {\n            blocks.push({ type: \"paragraph\", content: { text } });\n          }\n        }\n        continue;\n      }\n\n      if (node.nodeType !== Node.ELEMENT_NODE) continue;\n\n      const tag = node.tagName;\n\n      // Skip invisible elements\n      if (tag === \"BR\") continue;\n\n      // Headings\n      if (tag === \"H1\") {\n        const text = getInnerText(node);\n        if (text) blocks.push({ type: \"heading_1\", content: { text } });\n        continue;\n      }\n      if (tag === \"H2\") {\n        const text = getInnerText(node);\n        if (text) blocks.push({ type: \"heading_2\", content: { text } });\n        continue;\n      }\n      if (tag === \"H3\" || tag === \"H4\" || tag === \"H5\" || tag === \"H6\") {\n        const text = getInnerText(node);\n        if (text) blocks.push({ type: \"heading_3\", content: { text } });\n        continue;\n      }\n\n      // Horizontal rule\n      if (tag === \"HR\") {\n        blocks.push({ type: \"divider\", content: {} });\n        continue;\n      }\n\n      // Blockquote\n      if (tag === \"BLOCKQUOTE\") {\n        const text = getInnerText(node);\n        if (text) blocks.push({ type: \"quote\", content: { text } });\n        continue;\n      }\n\n      // Code blocks (pre > code)\n      if (tag === \"PRE\") {\n        const codeEl = node.querySelector(\"code\");\n        const text = (codeEl || node).textContent.trim();\n        if (text) {\n          // Try to detect language from class\n          const langClass = (codeEl || node).className || \"\";\n          const langMatch = langClass.match(\n            /(?:language-|lang-)(\\w+)/\n          );\n          const language = langMatch ? langMatch[1] : \"\";\n          blocks.push({\n            type: \"code\",\n            content: { text, language },\n          });\n        }\n        continue;\n      }\n\n      // Lists — extract each LI as a list item block\n      if (tag === \"UL\") {\n        extractListItems(node, \"bulleted_list\", blocks);\n        continue;\n      }\n      if (tag === \"OL\") {\n        extractListItems(node, \"numbered_list\", blocks);\n        continue;\n      }\n\n      // Paragraphs\n      if (tag === \"P\") {\n        const text = getInnerText(node);\n        if (text) blocks.push({ type: \"paragraph\", content: { text } });\n        continue;\n      }\n\n      // Figure — look for image or caption\n      if (tag === \"FIGURE\") {\n        const img = node.querySelector(\"img\");\n        const caption = node.querySelector(\"figcaption\");\n        if (img && img.src) {\n          blocks.push({\n            type: \"image\",\n            content: {\n              url: img.src,\n              caption: caption ? getInnerText(caption) : \"\",\n            },\n          });\n        } else {\n          // Fall through to extract inner content\n          extractBlocks(node, blocks);\n        }\n        continue;\n      }\n\n      // Images (standalone)\n      if (tag === \"IMG\") {\n        const src = node.src || node.getAttribute(\"src\");\n        if (src) {\n          blocks.push({\n            type: \"image\",\n            content: { url: src, caption: node.alt || \"\" },\n          });\n        }\n        continue;\n      }\n\n      // For container elements (div, section, article), recurse\n      if (\n        tag === \"DIV\" ||\n        tag === \"SECTION\" ||\n        tag === \"ARTICLE\" ||\n        tag === \"MAIN\" ||\n        tag === \"SPAN\" ||\n        tag === \"A\"\n      ) {\n        // Check if this div basically just wraps text (no block children)\n        const hasBlockChildren = Array.from(node.children).some((child) =>\n          BLOCK_ELEMENTS.has(child.tagName)\n        );\n\n        if (!hasBlockChildren) {\n          // Treat as a paragraph\n          const text = getInnerText(node);\n          if (text) {\n            blocks.push({ type: \"paragraph\", content: { text } });\n          }\n        } else {\n          extractBlocks(node, blocks);\n        }\n        continue;\n      }\n\n      // Fallback: try to get text content\n      const text = getInnerText(node);\n      if (text) {\n        blocks.push({ type: \"paragraph\", content: { text } });\n      }\n    }\n  }",
  "new_string": "  // Inline elements that should NOT cause paragraph breaks\n  const INLINE_ELEMENTS = new Set([\n    \"A\",\n    \"ABBR\",\n    \"ACRONYM\",\n    \"B\",\n    \"BDO\",\n    \"BIG\",\n    \"BR\",\n    \"BUTTON\",\n    \"CITE\",\n    \"CODE\",\n    \"DFN\",\n    \"EM\",\n    \"I\",\n    \"IMG\",\n    \"INPUT\",\n    \"KBD\",\n    \"LABEL\",\n    \"MAP\",\n    \"OBJECT\",\n    \"OUTPUT\",\n    \"Q\",\n    \"SAMP\",\n    \"SELECT\",\n    \"SMALL\",\n    \"SPAN\",\n    \"STRONG\",\n    \"SUB\",\n    \"SUP\",\n    \"TEXTAREA\",\n    \"TIME\",\n    \"TT\",\n    \"U\",\n    \"VAR\",\n    \"WBR\",\n    \"MARK\",\n    \"S\",\n    \"STRIKE\",\n    \"DEL\",\n    \"INS\",\n    \"FONT\",\n  ]);\n\n  /**\n   * Check if an element is purely inline (contains no block-level descendants).\n   */\n  function isPurelyInline(el) {\n    if (!el.children || el.children.length === 0) return true;\n    for (const child of el.children) {\n      if (!INLINE_ELEMENTS.has(child.tagName)) return false;\n    }\n    return true;\n  }\n\n  /**\n   * Walk the DOM tree and produce structured blocks.\n   * Each block has { type, content } matching workspace block types.\n   */\n  function extractBlocks(root, blocks) {\n    for (const node of root.childNodes) {\n      if (blocks.length >= MAX_BLOCKS) return;\n\n      if (node.nodeType === Node.TEXT_NODE) {\n        const text = node.textContent.trim();\n        if (text) {\n          // Merge with previous paragraph if possible\n          const last = blocks[blocks.length - 1];\n          if (last && last.type === \"paragraph\") {\n            last.content.text += \" \" + text;\n          } else {\n            blocks.push({ type: \"paragraph\", content: { text } });\n          }\n        }\n        continue;\n      }\n\n      if (node.nodeType !== Node.ELEMENT_NODE) continue;\n\n      const tag = node.tagName;\n\n      // Skip invisible elements and line breaks\n      if (tag === \"BR\") continue;\n\n      // Skip hidden elements\n      try {\n        const style = window.getComputedStyle(node);\n        if (style.display === \"none\" || style.visibility === \"hidden\") continue;\n      } catch {\n        // getComputedStyle can fail on detached nodes in cloned DOM — skip check\n      }\n\n      // Headings\n      if (tag === \"H1\") {\n        const text = getCleanText(node);\n        if (text) blocks.push({ type: \"heading_1\", content: { text } });\n        continue;\n      }\n      if (tag === \"H2\") {\n        const text = getCleanText(node);\n        if (text) blocks.push({ type: \"heading_2\", content: { text } });\n        continue;\n      }\n      if (tag === \"H3\" || tag === \"H4\" || tag === \"H5\" || tag === \"H6\") {\n        const text = getCleanText(node);\n        if (text) blocks.push({ type: \"heading_3\", content: { text } });\n        continue;\n      }\n\n      // Horizontal rule\n      if (tag === \"HR\") {\n        blocks.push({ type: \"divider\", content: {} });\n        continue;\n      }\n\n      // Blockquote\n      if (tag === \"BLOCKQUOTE\") {\n        const text = getCleanText(node);\n        if (text) blocks.push({ type: \"quote\", content: { text } });\n        continue;\n      }\n\n      // Code blocks (pre > code)\n      if (tag === \"PRE\") {\n        const codeEl = node.querySelector(\"code\");\n        const text = (codeEl || node).textContent.trim();\n        if (text) {\n          const langClass = (codeEl || node).className || \"\";\n          const langMatch = langClass.match(\n            /(?:language-|lang-)(\\w+)/\n          );\n          const language = langMatch ? langMatch[1] : \"\";\n          blocks.push({\n            type: \"code\",\n            content: { text, language },\n          });\n        }\n        continue;\n      }\n\n      // Lists — extract each LI as a list item block\n      if (tag === \"UL\") {\n        extractListItems(node, \"bulleted_list\", blocks);\n        continue;\n      }\n      if (tag === \"OL\") {\n        extractListItems(node, \"numbered_list\", blocks);\n        continue;\n      }\n\n      // Paragraphs\n      if (tag === \"P\") {\n        const text = getCleanText(node);\n        if (text) blocks.push({ type: \"paragraph\", content: { text } });\n        continue;\n      }\n\n      // Figure — look for image or caption\n      if (tag === \"FIGURE\") {\n        const img = node.querySelector(\"img\");\n        const caption = node.querySelector(\"figcaption\");\n        if (img && img.src) {\n          blocks.push({\n            type: \"image\",\n            content: {\n              url: img.src,\n              caption: caption ? getCleanText(caption) : \"\",\n            },\n          });\n        } else {\n          extractBlocks(node, blocks);\n        }\n        continue;\n      }\n\n      // Images (standalone)\n      if (tag === \"IMG\") {\n        const src = node.src || node.getAttribute(\"src\");\n        if (src) {\n          blocks.push({\n            type: \"image\",\n            content: { url: src, caption: node.alt || \"\" },\n          });\n        }\n        continue;\n      }\n\n      // Inline elements — merge into previous paragraph or start new one\n      if (INLINE_ELEMENTS.has(tag)) {\n        const text = getCleanText(node);\n        if (text) {\n          const last = blocks[blocks.length - 1];\n          if (last && last.type === \"paragraph\") {\n            last.content.text += \" \" + text;\n          } else {\n            blocks.push({ type: \"paragraph\", content: { text } });\n          }\n        }\n        continue;\n      }\n\n      // Container elements (div, section, article, etc.)\n      // If this element is purely inline (no block descendants), treat as a paragraph\n      if (isPurelyInline(node)) {\n        const text = getCleanText(node);\n        if (text) {\n          blocks.push({ type: \"paragraph\", content: { text } });\n        }\n      } else {\n        // Has block-level children — recurse into them\n        extractBlocks(node, blocks);\n      }\n    }\n  }"
}
Now let me fix `getInnerText` — it uses `el.innerText` which includes CSS pseudo-element content (like that `%`). We should use `textContent` instead, which only grabs DOM text nodes. I'll rename it and improve it.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\extension\\content.js",
  "old_string": "  /**\n   * Get clean inner text from an element, collapsing whitespace.\n   */\n  function getInnerText(el) {\n    // Use innerText which respects visual rendering better than textContent\n    let text = el.innerText || el.textContent || \"\";\n    text = text.replace(/\\t/g, \" \").replace(/ {2,}/g, \" \").trim();\n    return text;\n  }",
  "new_string": "  /**\n   * Get clean text from an element, using textContent to avoid\n   * CSS pseudo-element artifacts (::before, ::after content).\n   * Collapses whitespace into single spaces.\n   */\n  function getCleanText(el) {\n    let text = el.textContent || \"\";\n    text = text.replace(/\\t/g, \" \").replace(/ {2,}/g, \" \").trim();\n    return text;\n  }"
}
Now I also need to update the flat text extraction to use `textContent` instead of `innerText` in the main `extractContent` function, and also update the `extractListItems` function to use `getCleanText`.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\extension\\content.js",
  "old_string": "      const text = getInnerText(li);",
  "new_string": "      const text = getCleanText(li);"
}
Now let me also fix the `text` extraction in the main function to use `textContent` consistently:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\extension\\content.js",
  "offset": 130,
  "limit": 50
}
Good — line 135 already uses `textContent`, so the flat text is fine. Now there's one more important thing: I need to also handle the issue where blocks contain duplicate/overlapping text. The current approach recurses into containers, but a `DIV` that's purely inline gets its full text captured as a paragraph. If a sibling `DIV` also wraps text, they become separate paragraphs — which is correct. But I should add deduplication logic so that if a parent `DIV` recurses into children and one child captures text, we don't accidentally also capture overlapping text from a cousin.

Actually, looking more carefully, the recursion logic is now sound: purely inline elements produce one paragraph each, and containers with block children recurse. The key improvement is that previously, `SPAN` and `A` tags were listed alongside `DIV`/`SECTION` in the container check, causing `A` tags with text to be treated as paragraph containers. Now inline tags are handled separately and merge into the previous paragraph.

Let me also add a post-processing step to clean up the blocks — merge adjacent very short paragraphs that are clearly fragments, and deduplicate identical adjacent blocks:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\extension\\content.js",
  "old_string": "    // If structured extraction yielded nothing useful, fall back to text splitting\n    if (blocks.length === 0 && text.length >= 20) {\n      const paragraphs = text\n        .split(/\\n{2,}/)\n        .map((p) => p.trim())\n        .filter(Boolean);\n      for (const p of paragraphs) {\n        blocks.push({ type: \"paragraph\", content: { text: p } });\n      }\n    }\n\n    return {\n      success: true,\n      title: document.title || \"\",\n      url: window.location.href,\n      domain: window.location.hostname,\n      text: text,\n      blocks: blocks.slice(0, MAX_BLOCKS),\n      isSelection: false,\n    };",
  "new_string": "    // If structured extraction yielded nothing useful, fall back to text splitting\n    if (blocks.length === 0 && text.length >= 20) {\n      const paragraphs = text\n        .split(/\\n{2,}/)\n        .map((p) => p.trim())\n        .filter(Boolean);\n      for (const p of paragraphs) {\n        blocks.push({ type: \"paragraph\", content: { text: p } });\n      }\n    }\n\n    // Post-process: deduplicate adjacent identical blocks and remove empty ones\n    const cleaned = deduplicateBlocks(blocks);\n\n    return {\n      success: true,\n      title: document.title || \"\",\n      url: window.location.href,\n      domain: window.location.hostname,\n      text: text,\n      blocks: cleaned.slice(0, MAX_BLOCKS),\n      isSelection: false,\n    };"
}
Now I need to add the `deduplicateBlocks` function. Let me add it before the closing IIFE:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\extension\\content.js",
  "offset": 380,
  "limit": 40
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\extension\\content.js",
  "old_string": "  /**\n   * Get clean text from an element, using textContent to avoid\n   * CSS pseudo-element artifacts (::before, ::after content).\n   * Collapses whitespace into single spaces.\n   */\n  function getCleanText(el) {\n    let text = el.textContent || \"\";\n    text = text.replace(/\\t/g, \" \").replace(/ {2,}/g, \" \").trim();\n    return text;\n  }\n})();",
  "new_string": "  /**\n   * Get clean text from an element, using textContent to avoid\n   * CSS pseudo-element artifacts (::before, ::after content).\n   * Collapses whitespace into single spaces.\n   */\n  function getCleanText(el) {\n    let text = el.textContent || \"\";\n    text = text.replace(/\\t/g, \" \").replace(/ {2,}/g, \" \").trim();\n    return text;\n  }\n\n  /**\n   * Remove duplicate adjacent blocks and blocks whose text is a\n   * substring of the immediately following block (parent text captured\n   * before child content was extracted).\n   */\n  function deduplicateBlocks(blocks) {\n    const result = [];\n    for (let i = 0; i < blocks.length; i++) {\n      const block = blocks[i];\n      const text = (block.content && block.content.text) || \"\";\n\n      // Skip empty text blocks\n      if (!text && block.type !== \"divider\" && block.type !== \"image\") continue;\n\n      // Skip if identical to previous block\n      const prev = result[result.length - 1];\n      if (prev && prev.type === block.type && prev.content.text === text) continue;\n\n      // Skip if this block's text is fully contained in the next block\n      // (happens when a parent DIV's text is captured, then its children are too)\n      if (text && i + 1 < blocks.length) {\n        const nextText = (blocks[i + 1].content && blocks[i + 1].content.text) || \"\";\n        if (nextText && text.length > 20 && nextText.startsWith(text)) continue;\n      }\n\n      result.push(block);\n    }\n    return result;\n  }\n})();"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix content.js extractBlocks to handle div-heavy sites with better paragraph splitting",
      "status": "completed",
      "activeForm": "Fixing content extraction for div-heavy modern sites"
    },
    {
      "content": "Ensure text nodes separated by block-level divs produce separate paragraphs",
      "status": "completed",
      "activeForm": "Ensuring proper paragraph separation from nested divs"
    },
    {
      "content": "Filter out CSS pseudo-element artifacts like % symbols",
      "status": "completed",
      "activeForm": "Filtering CSS pseudo-element artifacts"
    },
    {
      "content": "Verify the full content.js file is consistent and correct",
      "status": "in_progress",
      "activeForm": "Verifying final content.js file"
    }
  ]
}
Let me verify the final file:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\extension\\content.js"
}
Wait — I just realized there's a problem with `getComputedStyle` on a **cloned** DOM. When we do `document.cloneNode(true)`, the cloned elements are detached from the rendered document, so `window.getComputedStyle()` won't return meaningful results (or may throw). The extraction runs on a clone. Let me remove that hidden element check since it won't work on cloned DOM and could cause issues:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\extension\\content.js",
  "old_string": "      // Skip invisible elements and line breaks\n      if (tag === \"BR\") continue;\n\n      // Skip hidden elements\n      try {\n        const style = window.getComputedStyle(node);\n        if (style.display === \"none\" || style.visibility === \"hidden\") continue;\n      } catch {\n        // getComputedStyle can fail on detached nodes in cloned DOM — skip check\n      }",
  "new_string": "      // Skip line breaks\n      if (tag === \"BR\") continue;\n\n      // Skip elements with hidden attribute\n      if (node.hasAttribute && node.hasAttribute(\"hidden\")) continue;\n      if (node.getAttribute && node.getAttribute(\"aria-hidden\") === \"true\") continue;"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix content.js extractBlocks to handle div-heavy sites with better paragraph splitting",
      "status": "completed",
      "activeForm": "Fixing content extraction for div-heavy modern sites"
    },
    {
      "content": "Ensure text nodes separated by block-level divs produce separate paragraphs",
      "status": "completed",
      "activeForm": "Ensuring proper paragraph separation from nested divs"
    },
    {
      "content": "Filter out CSS pseudo-element artifacts like % symbols",
      "status": "completed",
      "activeForm": "Filtering CSS pseudo-element artifacts"
    },
    {
      "content": "Verify the full content.js file is consistent and correct",
      "status": "completed",
      "activeForm": "Verifying final content.js file"
    }
  ]
}
Here's a summary of the three fixes applied to `extension/content.js`:

**1. Fixed CSS pseudo-element artifacts (`%` symbols, etc.)**
- Changed from `el.innerText` to `el.textContent` (renamed `getInnerText` → `getCleanText`). `innerText` includes CSS `::before`/`::after` content; `textContent` only reads actual DOM text nodes.

**2. Fixed the flat text / wall-of-text problem**
- Added a proper `INLINE_ELEMENTS` set (SPAN, A, STRONG, EM, etc.) to distinguish inline from block elements
- Added `isPurelyInline()` check — a DIV is now only collapsed into a single paragraph if all its children are inline elements
- Previously, `SPAN` and `A` tags were listed as "container elements" alongside `DIV`/`SECTION`, causing them to trigger paragraph-splitting logic incorrectly. Now inline tags merge into the current paragraph instead of starting new ones
- Non-inline child elements (like nested DIVs) cause proper recursion, so each visual section becomes its own block

**3. Added post-processing deduplication**
- `deduplicateBlocks()` removes identical adjacent blocks and blocks whose text is a prefix of the next block (which happens when a parent DIV's text gets captured and then its children produce the same text again)
- Also filters out empty text blocks

Reload the extension in Chrome to pick up the changes — the next clip should produce properly structured, separated blocks instead of a single wall of text.