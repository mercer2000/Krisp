"use client";

import { isNativeMobile, getPlatform } from "./platform";

/**
 * Initialize push notification registration on native mobile.
 *
 * Requests permission, registers with FCM/APNs, and sends the device token
 * to the backend for storage.
 *
 * No-op on web.
 *
 * @param onNotificationTap - Callback when user taps a notification.
 *   Receives the notification data payload for navigation.
 */
export async function initPushNotifications(
  onNotificationTap?: (data: Record<string, string>) => void
): Promise<void> {
  if (!isNativeMobile()) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") return;

  await PushNotifications.register();

  PushNotifications.addListener("registration", async (token) => {
    try {
      await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.value,
          platform: getPlatform(),
        }),
      });
    } catch {
      // Silent fail — will retry on next app launch
    }
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error("Push registration error:", error);
  });

  if (onNotificationTap) {
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        onNotificationTap(action.notification.data);
      }
    );
  }
}
