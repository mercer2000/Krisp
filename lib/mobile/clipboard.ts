"use client";

import { isNativeMobile } from "./platform";

/**
 * Copy text to clipboard with native fallback.
 *
 * On native mobile, uses the Capacitor Clipboard plugin.
 * On web, uses the standard navigator.clipboard API with textarea fallback.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (isNativeMobile()) {
    const { Clipboard } = await import("@capacitor/clipboard");
    await Clipboard.write({ string: text });
    return;
  }

  // Web — standard API with legacy fallback
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}
