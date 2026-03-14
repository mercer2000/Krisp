"use client";

import { useEffect, useRef } from "react";
import { isNativeMobile } from "./platform";

/**
 * Hook that pauses/resumes a polling callback based on app foreground state.
 *
 * On native mobile, uses Capacitor App plugin to detect background/foreground.
 * On web, uses the Page Visibility API.
 *
 * @param callback - The function to call on each interval tick
 * @param intervalMs - Polling interval in milliseconds
 * @param enabled - Whether polling should be active at all (default: true)
 */
export function useAppAwarePolling(
  callback: () => void,
  intervalMs: number,
  enabled = true
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    function start() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(
        () => callbackRef.current(),
        intervalMs
      );
    }

    function stop() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Start polling immediately
    start();

    if (isNativeMobile()) {
      // Capacitor app state listener
      let cleanup: (() => void) | undefined;
      import("@capacitor/app").then(({ App }) => {
        App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) {
            callbackRef.current(); // Refresh immediately on resume
            start();
          } else {
            stop();
          }
        }).then((handle) => {
          cleanup = () => handle.remove();
        });
      });

      return () => {
        stop();
        cleanup?.();
      };
    } else {
      // Web — use Page Visibility API
      function handleVisibility() {
        if (document.hidden) {
          stop();
        } else {
          callbackRef.current();
          start();
        }
      }
      document.addEventListener("visibilitychange", handleVisibility);

      return () => {
        stop();
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    }
  }, [intervalMs, enabled]);
}
