# MyOpenBrain — Capacitor Mobile App Plan

## Overview

Wrap the existing Next.js web app in a Capacitor shell to ship native Android and iOS apps. The app is already API-first (60% client components fetching via `/api/` routes) with cookie-based auth, mobile-responsive layouts, and safe area inset support — making it an ideal Capacitor candidate with minimal code changes.

## Architecture

```
┌─────────────────────────────────┐
│         Native Shell            │
│  (Capacitor iOS / Android)      │
│                                 │
│  ┌───────────────────────────┐  │
│  │       WebView             │  │
│  │  https://myopenbrain.com  │  │
│  │                           │  │
│  │  Next.js App (unchanged)  │  │
│  └───────────────────────────┘  │
│                                 │
│  Native Plugins:                │
│  - Push Notifications           │
│  - Biometrics                   │
│  - Status Bar                   │
│  - Splash Screen                │
│  - Deep Links                   │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Existing Backend (unchanged)   │
│  - Next.js API routes           │
│  - Neon PostgreSQL              │
│  - Neon Auth (cookie-based)     │
│  - Stripe, OpenRouter, etc.     │
└─────────────────────────────────┘
```

**Approach:** Live server mode — the WebView loads the hosted app at `https://myopenbrain.com`. No static export or SSR changes required. All server components, API routes, and middleware work as-is.

---

## Phase 1: Project Setup

### 1.1 Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "MyOpenBrain" "com.myopenbrain.app" --web-dir=out
```

> Note: `--web-dir` is required by init but won't be used since we're pointing at a live URL.

### 1.2 Create `capacitor.config.ts`

```ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.myopenbrain.app",
  appName: "MyOpenBrain",
  // Point at the live server — no static build needed
  server: {
    url: "https://myopenbrain.com",
    cleartext: false, // HTTPS only
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    StatusBar: {
      style: "default", // adapts to light/dark
    },
  },
  ios: {
    contentInset: "always",
    preferredContentMode: "mobile",
  },
  android: {
    backgroundColor: "#ffffff",
  },
};

export default config;
```

### 1.3 Add Platforms

```bash
npx cap add ios
npx cap add android
```

This creates `ios/` and `android/` directories in the project root.

### 1.4 .gitignore Updates

Add to `.gitignore`:
```
# Capacitor native projects (optional — some teams commit these)
ios/App/Pods/
android/.gradle/
android/app/build/
```

---

## Phase 2: Code Adaptations (Web App Changes)

These are changes to the existing Next.js codebase to improve mobile compatibility.

### 2.1 localStorage Cache — `lib/cache/inboxCache.ts`

**Problem:** Uses `localStorage` for inbox caching. Works in WebView but can be unreliable across app restarts on some Android versions.

**Fix:** Add a try-catch wrapper with graceful degradation:

```ts
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or unavailable — silently degrade
  }
}
```

**Optional upgrade:** Migrate to Capacitor Preferences plugin for persistent storage:
```bash
npm install @capacitor/preferences
```

### 2.2 Clipboard — `components/meeting/MeetingDetailDrawer.tsx`

**Problem:** Uses `navigator.clipboard.writeText()` which may fail in some WebView contexts.

**Fix:** Add fallback:

```ts
import { Capacitor } from "@capacitor/core";
import { Clipboard } from "@capacitor/clipboard"; // npm install @capacitor/clipboard

async function copyToClipboard(text: string) {
  if (Capacitor.isNativePlatform()) {
    await Clipboard.write({ string: text });
  } else {
    await navigator.clipboard.writeText(text);
  }
}
```

### 2.3 File Uploads — `components/pages/editor/BlockEditor.tsx`

**Problem:** Creates `<input type="file" accept="image/*">` dynamically. Works in WebView but native camera/gallery picker is better UX.

**Fix (optional, for better UX):**

```bash
npm install @capacitor/camera
```

```ts
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType } from "@capacitor/camera";

async function pickImage(): Promise<File | null> {
  if (Capacitor.isNativePlatform()) {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      quality: 80,
    });
    // Convert data URL to File for existing upload logic
    const blob = await fetch(photo.dataUrl!).then((r) => r.blob());
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  }
  // Fall back to existing file input on web
  return null;
}
```

### 2.4 Background Polling — Battery Optimization

**Problem:** Multiple `setInterval` polls drain mobile battery:
- `SplitInboxPane.tsx` — 20s email poll
- `SideNav.tsx` — 60s unread count poll
- `AIUsageWidget.tsx` — 5min usage poll
- `TimeGrid.tsx` — 60s time indicator update

**Fix:** Detect native platform and reduce polling frequency:

```ts
import { Capacitor } from "@capacitor/core";

const isMobile = Capacitor.isNativePlatform();
const POLL_INTERVAL = isMobile ? 60_000 : 20_000; // 60s on mobile, 20s on web
```

Also pause polling when the app is backgrounded:

```ts
import { App } from "@capacitor/app";

App.addListener("appStateChange", ({ isActive }) => {
  if (isActive) {
    startPolling();
  } else {
    stopPolling();
  }
});
```

### 2.5 Keyboard Shortcuts — `lib/hooks/useKeyboardShortcuts.ts`

**Problem:** Extensive shortcuts (Mod+K, G+D sequences) are irrelevant on mobile.

**Fix:** Disable shortcut registration on mobile:

```ts
import { Capacitor } from "@capacitor/core";

export function useKeyboardShortcuts() {
  // Skip all keyboard shortcut registration on native mobile
  if (Capacitor.isNativePlatform()) return;
  // ... existing logic
}
```

Also hide any keyboard shortcut hints in the UI (tooltips, help page) when on mobile.

### 2.6 Platform Detection — `useKeyboardShortcuts.ts:33`

**Problem:** `navigator.platform` may report incorrectly in WebView.

**Fix:**

```ts
import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device"; // npm install @capacitor/device

async function getPlatform() {
  if (Capacitor.isNativePlatform()) {
    const info = await Device.getInfo();
    return info.platform; // "ios" | "android"
  }
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "mac" : "other";
}
```

---

## Phase 3: OAuth & Auth

### 3.1 Cookie-Based Auth (No Changes Needed)

Neon Auth uses HTTP-only cookies. The Capacitor WebView shares the cookie jar with the web context, so:
- `auth.getSession()` works on every API route
- Middleware redirects work as-is
- No token management code needed

### 3.2 OAuth Redirect URIs

Update redirect URIs for all OAuth integrations to also accept the Capacitor app scheme.

**Google OAuth (Gmail + Calendar):**
- Add `https://myopenbrain.com/api/gmail/oauth/callback` (already exists)
- Add `capacitor://myopenbrain.com/api/gmail/oauth/callback` (new)

**Microsoft/Outlook OAuth:**
- Add `capacitor://myopenbrain.com/api/outlook/oauth/callback`

**Zoom OAuth:**
- Add `capacitor://myopenbrain.com/api/zoom/oauth/callback`

**Neon Auth (Google sign-in):**
- Update `NEON_AUTH_BASE_URL` allowed redirect origins to include `capacitor://`

> In practice, since we're using live server mode (`server.url`), the WebView navigates to the real domain. OAuth redirects may just work without URI changes. **Test this first before adding custom schemes.**

### 3.3 Session Persistence

Verify that cookies survive:
- App backgrounding / foregrounding
- Device restart
- App force-quit and relaunch

If cookies are lost, add Capacitor HTTP plugin to handle cookies natively:
```bash
npm install @capacitor/http
```

---

## Phase 4: Native Features

### 4.1 Push Notifications

**Install:**
```bash
npm install @capacitor/push-notifications
```

**iOS Setup:**
1. Enable Push Notifications capability in Xcode
2. Create APNs key in Apple Developer portal
3. Upload APNs key to your push notification service (e.g., Firebase)

**Android Setup:**
1. Create Firebase project
2. Add `google-services.json` to `android/app/`
3. Enable FCM in Firebase console

**Backend Work:**
- Create `/api/push/register` endpoint to store device tokens per user
- Add `device_tokens` table to schema:
  ```sql
  CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    token TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'ios' | 'android'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
  );
  ```
- Trigger push notifications from:
  - New email received (webhook handlers)
  - Weekly plan generated
  - Action item due dates
  - AI brain mentions

**Client Registration:**
```ts
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";

async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") return;

  await PushNotifications.register();

  PushNotifications.addListener("registration", async (token) => {
    await fetch("/api/push/register", {
      method: "POST",
      body: JSON.stringify({
        token: token.value,
        platform: Capacitor.getPlatform(),
      }),
    });
  });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    // Handle foreground notification
  });

  PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action) => {
      // Handle notification tap — navigate to relevant page
      const data = action.notification.data;
      if (data.type === "email") router.push(`/inbox/${data.emailId}`);
      if (data.type === "card") router.push(`/boards/${data.boardId}`);
    }
  );
}
```

### 4.2 Deep Linking

**Install:**
```bash
npm install @capacitor/app
```

**Configure universal links / app links:**

**iOS** — `ios/App/App/Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>myopenbrain</string>
    </array>
  </dict>
</array>
```

**Android** — `android/app/src/main/AndroidManifest.xml`:
```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="myopenbrain.com" />
</intent-filter>
```

**Handle deep links in the app:**
```ts
import { App as CapApp } from "@capacitor/app";

CapApp.addListener("appUrlOpen", (event) => {
  const url = new URL(event.url);
  router.push(url.pathname + url.search);
});
```

### 4.3 Status Bar

```bash
npm install @capacitor/status-bar
```

```ts
import { StatusBar, Style } from "@capacitor/status-bar";

// Match the app theme
function updateStatusBar(isDark: boolean) {
  StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
  if (Capacitor.getPlatform() === "android") {
    StatusBar.setBackgroundColor({ color: isDark ? "#0a0a0a" : "#ffffff" });
  }
}
```

### 4.4 Splash Screen

```bash
npm install @capacitor/splash-screen
```

**Assets needed:**
- `resources/splash.png` — 2732x2732px centered logo
- `resources/icon.png` — 1024x1024px app icon

Generate platform-specific assets:
```bash
npm install -D @capacitor/assets
npx capacitor-assets generate
```

### 4.5 Biometric Lock (Optional)

```bash
npm install capacitor-native-biometric
```

```ts
import { NativeBiometric } from "capacitor-native-biometric";

async function checkBiometric() {
  const { isAvailable } = await NativeBiometric.isAvailable();
  if (!isAvailable) return;

  const verified = await NativeBiometric.verifyIdentity({
    reason: "Unlock MyOpenBrain",
    title: "Biometric Authentication",
  });
  return verified;
}
```

---

## Phase 5: App Store Preparation

### 5.1 Apple Developer Account

- **Cost:** $99/year
- **URL:** https://developer.apple.com/programs/
- **Timeline:** Enrollment takes 24–48 hours
- **Requirements:** Apple ID, legal entity info, D-U-N-S number (for organizations)

### 5.2 Google Play Console

- **Cost:** $25 one-time
- **URL:** https://play.google.com/console
- **Timeline:** Instant after payment
- **Requirements:** Google account, developer agreement

### 5.3 Required Assets

| Asset | iOS | Android |
|-------|-----|---------|
| App icon | 1024x1024 (no alpha) | 512x512 |
| Screenshots | 6.7" (1290x2796), 5.5" (1242x2208), iPad 12.9" | Phone (1080x1920+), Tablet (optional) |
| Feature graphic | — | 1024x500 |
| Short description | Subtitle (30 chars) | 80 chars |
| Full description | 4000 chars | 4000 chars |
| Privacy policy URL | Required | Required |
| App category | Productivity | Productivity |

### 5.4 iOS-Specific Requirements

- **App Transport Security:** Already handled (HTTPS only)
- **Privacy manifest:** Required since Spring 2024 — declare data collection practices
- **Sign in with Apple:** Required if you offer third-party sign-in (Google). Either add Apple sign-in via Neon Auth or request an exemption.
- **Review time:** 24–48 hours typical

### 5.5 Android-Specific Requirements

- **Target SDK:** Must target latest Android API level (currently 34+)
- **App Bundle:** Submit `.aab` not `.apk`
- **Data safety form:** Declare data collection in Play Console
- **Review time:** Usually a few hours, up to 7 days for first submission

---

## Phase 6: Build & Deploy

### 6.1 Development Workflow

```bash
# Sync web changes to native projects
npx cap sync

# Open in IDE for testing
npx cap open ios      # Opens Xcode
npx cap open android  # Opens Android Studio

# Live reload during development
# In capacitor.config.ts, temporarily set:
# server: { url: "http://192.168.x.x:3000", cleartext: true }
```

### 6.2 iOS Build

```bash
# In Xcode:
# 1. Select your team/signing certificate
# 2. Product → Archive
# 3. Distribute to App Store Connect
# 4. Submit for review in App Store Connect
```

### 6.3 Android Build

```bash
# In Android Studio:
# 1. Build → Generate Signed Bundle / APK
# 2. Choose Android App Bundle
# 3. Upload .aab to Google Play Console
# 4. Submit for review
```

### 6.4 CI/CD (Optional)

Consider adding Fastlane or Appflow for automated builds:
```bash
# Fastlane (free, open source)
gem install fastlane
fastlane init
```

---

## What Works Without Changes

For reference, these features work out of the box in the Capacitor WebView:

- All 110+ API routes (cookie auth)
- All 27 client-rendered pages
- All 16 server-rendered pages
- Middleware auth redirects
- Dark mode / theme switching
- Kanban drag-and-drop (dnd-kit PointerSensor)
- Email swipe gestures (SwipeableRow touch events)
- Stripe checkout (server-side redirect)
- Mobile bottom nav (already has `env(safe-area-inset-bottom)`)
- Responsive Tailwind layouts (all `md:`, `sm:` breakpoints)
- Calendar views (Month/Week/Day/Agenda)
- AI Brain chat interface
- File uploads via `<input type="file">` (basic — enhance with Camera plugin for better UX)

---

## Dependency Summary

### Required
```
@capacitor/core
@capacitor/cli
@capacitor/app           # deep linking, app state
@capacitor/splash-screen # splash screen
@capacitor/status-bar    # status bar styling
```

### Recommended
```
@capacitor/push-notifications  # push notifications
@capacitor/clipboard           # clipboard fallback
@capacitor/preferences         # persistent storage
@capacitor/device              # platform detection
@capacitor/assets              # icon/splash generation (dev dep)
```

### Optional
```
@capacitor/camera              # native image picker
@capacitor/keyboard            # keyboard events
capacitor-native-biometric     # biometric lock
@capacitor/http                # cookie persistence fallback
```

---

## Execution Order

| Step | Phase | Effort | Depends On |
|------|-------|--------|------------|
| 1 | Install Capacitor + add platforms | 1 hour | Nothing |
| 2 | Create `capacitor.config.ts` | 30 min | Step 1 |
| 3 | localStorage/clipboard/polling fixes | 2–3 hours | Nothing |
| 4 | Test auth flow in WebView | 1–2 hours | Step 2 |
| 5 | Test OAuth integrations | 1–2 hours | Step 4 |
| 6 | Add push notifications | 1–2 days | Steps 1, 4 |
| 7 | Add deep linking | 2–3 hours | Step 1 |
| 8 | Status bar + splash screen | 1–2 hours | Step 1 |
| 9 | Generate app icons + screenshots | 2–3 hours | Working app |
| 10 | Apple Developer + Play Console signup | 1 day (waiting) | Nothing |
| 11 | Privacy policy + store listings | 2–3 hours | Nothing |
| 12 | iOS build + submission | 2–3 hours | Steps 1–9 |
| 13 | Android build + submission | 1–2 hours | Steps 1–9 |
| 14 | App review + launch | 1–7 days (waiting) | Steps 12, 13 |

**Total active work: ~3–5 days**
**Total calendar time: ~1–2 weeks** (accounting for account approvals and app reviews)
