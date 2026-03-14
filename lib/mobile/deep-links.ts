"use client";

import { isNativeMobile } from "./platform";

/**
 * Initialize deep link handling on native mobile.
 *
 * When the app is opened via a deep link (e.g. myopenbrain://inbox/123 or
 * https://myopenbrain.com/inbox/123), this calls the provided navigate
 * function with the path.
 *
 * No-op on web.
 *
 * @param navigate - Function to navigate to a path (e.g. router.push)
 */
export async function initDeepLinks(
  navigate: (path: string) => void
): Promise<() => void> {
  if (!isNativeMobile()) return () => {};

  const { App } = await import("@capacitor/app");

  const handle = await App.addListener("appUrlOpen", (event) => {
    try {
      const url = new URL(event.url);
      navigate(url.pathname + url.search);
    } catch {
      // Invalid URL — ignore
    }
  });

  return () => handle.remove();
}
