/**
 * Mobile platform detection and utilities.
 *
 * Uses @capacitor/core to detect whether the app is running inside a native
 * Capacitor shell (Android/iOS) vs. a regular browser.
 *
 * @capacitor/core is a no-op on web — `isNativePlatform()` returns false,
 * so importing this module is safe in all environments.
 */

import { Capacitor } from "@capacitor/core";

/** True when running inside the Capacitor native shell (Android or iOS). */
export function isNativeMobile(): boolean {
  return Capacitor.isNativePlatform();
}

/** Returns "ios" | "android" | "web" */
export function getPlatform(): "ios" | "android" | "web" {
  return Capacitor.getPlatform() as "ios" | "android" | "web";
}
