"use client";

import { isNativeMobile, getPlatform } from "./platform";

/**
 * Update the native status bar style to match the app theme.
 *
 * No-op on web.
 */
export async function updateStatusBar(isDark: boolean): Promise<void> {
  if (!isNativeMobile()) return;

  const { StatusBar, Style } = await import("@capacitor/status-bar");

  await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });

  if (getPlatform() === "android") {
    await StatusBar.setBackgroundColor({
      color: isDark ? "#0a0a0a" : "#ffffff",
    });
  }
}
