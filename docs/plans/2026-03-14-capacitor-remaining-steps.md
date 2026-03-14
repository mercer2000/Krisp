# MyOpenBrain — Capacitor Remaining Steps

What's already done (in the codebase now) and what still needs manual work.

---

## Already Implemented

- [x] Capacitor v7 installed with all plugins
- [x] `capacitor.config.ts` created (points at `https://myopenbrain.com`)
- [x] Android native project scaffolded (`android/`)
- [x] `.gitignore` updated for Capacitor build artifacts
- [x] `lib/mobile/` utility module (platform detection, clipboard, app-state polling, push notifications, deep links, status bar)
- [x] `MeetingDetailDrawer.tsx` — clipboard uses Capacitor fallback
- [x] `SplitInboxPane.tsx` — polling pauses on background, 60s on mobile
- [x] `SideNav.tsx` — unread polling pauses on background, 120s on mobile
- [x] `AIUsageWidget.tsx` — usage polling pauses on background, 10min on mobile
- [x] `useKeyboardShortcuts.ts` — skips registration on native mobile

---

## Step 1: Fix Pre-existing Build Error

The `next build` fails due to `useSearchParams()` missing a Suspense boundary in `app/(app)/calendar/page.tsx`. This is unrelated to Capacitor but blocks production builds.

**Fix:** Wrap the calendar page component in `<Suspense>`:

```tsx
// app/(app)/calendar/page.tsx
import { Suspense } from "react";

export default function CalendarPage() {
  return (
    <Suspense>
      <CalendarContent />
    </Suspense>
  );
}
```

---

## Step 2: iOS Platform (Requires macOS)

You need a Mac with Xcode installed to build for iOS.

```bash
# On your Mac:
npx cap add ios
npx cap sync ios
npx cap open ios  # Opens Xcode
```

**In Xcode:**
1. Set your Apple Developer Team in Signing & Capabilities
2. Enable "Push Notifications" capability
3. Enable "Associated Domains" capability and add `applinks:myopenbrain.com`

---

## Step 3: Developer Accounts

### Apple Developer Program
- **URL:** https://developer.apple.com/programs/
- **Cost:** $99/year
- **Timeline:** 24–48 hours for approval
- **Requirements:** Apple ID, legal entity info, D-U-N-S number (for organizations)

### Google Play Console
- **URL:** https://play.google.com/console
- **Cost:** $25 one-time
- **Timeline:** Instant after payment
- **Requirements:** Google account, developer agreement

---

## Step 4: Firebase Setup (Push Notifications)

Push notification code is scaffolded in `lib/mobile/push-notifications.ts` but needs Firebase backend.

### 4.1 Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create project "MyOpenBrain"
3. Add an Android app with package name `com.myopenbrain.app`
4. Download `google-services.json`
5. Place it at `android/app/google-services.json`

### 4.2 iOS APNs Key (requires Apple Developer account)
1. Go to https://developer.apple.com/account/resources/authkeys
2. Create a new key with "Apple Push Notifications service (APNs)" enabled
3. Download the `.p8` key file
4. Upload it to Firebase → Project Settings → Cloud Messaging → APNs Authentication Key

### 4.3 Backend: Create Push Registration Endpoint

Create `app/api/push/register/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { deviceTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token, platform } = await req.json();
  if (!token || !platform) {
    return NextResponse.json({ error: "Missing token or platform" }, { status: 400 });
  }

  // Upsert device token
  await db
    .insert(deviceTokens)
    .values({ userId, token, platform })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}
```

### 4.4 Database: Add Device Tokens Table

Add to `lib/db/schema.ts`:

```ts
export const deviceTokens = pgTable("device_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  platform: text("platform").notNull(), // "ios" | "android"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  unique().on(table.userId, table.token),
]);
```

Then generate and run the migration:

```bash
DATABASE_URL="your-url" npx drizzle-kit generate
DATABASE_URL="your-url" npx drizzle-kit migrate
```

### 4.5 Send Push Notifications

Install Firebase Admin SDK:
```bash
npm install firebase-admin
```

Create `lib/push/send.ts`:

```ts
import admin from "firebase-admin";
import { db } from "@/lib/db";
import { deviceTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Initialize once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const tokens = await db
    .select({ token: deviceTokens.token })
    .from(deviceTokens)
    .where(eq(deviceTokens.userId, userId));

  if (tokens.length === 0) return;

  await admin.messaging().sendEachForMulticast({
    tokens: tokens.map((t) => t.token),
    notification: { title, body },
    data,
  });
}
```

### 4.6 Where to Trigger Notifications

Add `sendPushToUser()` calls to:

| Trigger | File | Notification |
|---------|------|-------------|
| New email received | `app/api/webhooks/email/gmail/[tenantId]/route.ts` | "New email from {sender}" |
| New email received | `app/api/webhooks/email/graph/[tenantId]/route.ts` | "New email from {sender}" |
| Weekly plan ready | `lib/weekly-plan/generate.ts` | "Your weekly plan is ready" |
| Action item due | (create a cron job) | "{item title} is due today" |

---

## Step 5: OAuth Redirect URIs

Since the app uses live server mode (WebView loads `https://myopenbrain.com`), OAuth redirects **should work as-is** because the WebView is on the real domain. Test first before making changes.

**If OAuth flows break in the WebView:**

### Google OAuth (Gmail + Calendar)
1. Go to https://console.cloud.google.com → APIs & Services → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add authorized redirect URI: `capacitor://myopenbrain.com/api/gmail/oauth/callback`

### Microsoft/Outlook OAuth
1. Go to https://portal.azure.com → App registrations
2. Add redirect URI: `capacitor://myopenbrain.com/api/outlook/oauth/callback`

### Zoom OAuth
1. Go to https://marketplace.zoom.us → Your app
2. Add redirect URL: `capacitor://myopenbrain.com/api/zoom/oauth/callback`

---

## Step 6: Deep Links / Universal Links

Code is scaffolded in `lib/mobile/deep-links.ts`. To activate:

### 6.1 Initialize in App Layout

Add to `app/providers.tsx` or a top-level client component:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { initDeepLinks } from "@/lib/mobile/deep-links";
import { initPushNotifications } from "@/lib/mobile/push-notifications";

export function MobileInit() {
  const router = useRouter();

  useEffect(() => {
    const cleanup = initDeepLinks((path) => router.push(path));
    initPushNotifications((data) => {
      if (data.type === "email" && data.emailId) router.push(`/inbox/${data.emailId}`);
      if (data.type === "card" && data.boardId) router.push(`/boards/${data.boardId}`);
      if (data.type === "weekly-plan") router.push("/weekly-reviews");
    });
    return () => { cleanup.then((fn) => fn()); };
  }, [router]);

  return null;
}
```

Then add `<MobileInit />` inside your providers tree in `app/(app)/layout.tsx`.

### 6.2 Host Verification Files

**Android (assetlinks.json):** Place at `public/.well-known/assetlinks.json`:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.myopenbrain.app",
    "sha256_cert_fingerprints": ["YOUR_SIGNING_KEY_FINGERPRINT"]
  }
}]
```

Get the fingerprint:
```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android
```

**iOS (apple-app-site-association):** Place at `public/.well-known/apple-app-site-association`:
```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAM_ID.com.myopenbrain.app",
      "paths": ["/inbox/*", "/boards/*", "/brain", "/dashboard", "/weekly-reviews"]
    }]
  }
}
```

Replace `TEAM_ID` with your Apple Developer Team ID.

---

## Step 7: Status Bar Integration

Add to `app/providers.tsx` or wherever theme changes are handled:

```tsx
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { updateStatusBar } from "@/lib/mobile/status-bar";

function StatusBarSync() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    updateStatusBar(resolvedTheme === "dark");
  }, [resolvedTheme]);
  return null;
}
```

Add `<StatusBarSync />` to your providers.

---

## Step 8: App Assets

### 8.1 App Icon
- Create `resources/icon.png` — 1024x1024px, no alpha/transparency
- Should be the MyOpenBrain logo on a solid background

### 8.2 Splash Screen
- Create `resources/splash.png` — 2732x2732px with centered logo
- Logo should be in the center 800x800px area (the rest gets cropped per device)

### 8.3 Generate Native Assets
```bash
npm install -D @capacitor/assets
npx capacitor-assets generate
```

This generates all required icon sizes and splash variants for both platforms.

### 8.4 Screenshots
Take screenshots on these device sizes (use emulators or real devices):

**iOS (required):**
- 6.7" iPhone (1290x2796) — iPhone 15 Pro Max
- 5.5" iPhone (1242x2208) — iPhone 8 Plus
- iPad Pro 12.9" (2048x2732) — if supporting iPad

**Android (required):**
- Phone (1080x1920 minimum)

Take screenshots of: Dashboard, Inbox, Brain chat, Kanban board, Calendar

---

## Step 9: Store Listings

### 9.1 Privacy Policy
Create a privacy policy page at `https://myopenbrain.com/privacy` covering:
- What data is collected (email content, calendar events, meeting transcripts)
- How data is stored (Neon PostgreSQL, encrypted at rest)
- Third-party services (OpenRouter for AI, Stripe for payments)
- Data deletion process
- Contact information

Both stores require a public privacy policy URL.

### 9.2 App Store Listing Copy

**App Name:** MyOpenBrain
**Subtitle (iOS, 30 chars):** AI-Powered Email & Task Manager
**Short Description (Android, 80 chars):** Smart inbox, AI brain, kanban boards, and weekly planning — all in one app.
**Category:** Productivity
**Content Rating:** Everyone / 4+

### 9.3 Data Safety / Privacy Nutrition Labels
Both stores require you to declare what data your app collects. You'll need to declare:
- Email address (for authentication)
- Email content (for inbox features)
- Calendar data (for scheduling)
- Usage data (for analytics)
- Payment info (handled by Stripe, not stored in-app)

---

## Step 10: Build and Submit

### Android
```bash
npx cap sync android
npx cap open android
```

In Android Studio:
1. Build → Generate Signed Bundle / APK
2. Create a new keystore (save it securely — you need it for every update)
3. Choose "Android App Bundle"
4. Upload the `.aab` to Google Play Console
5. Fill in store listing, content rating, pricing
6. Submit for review

### iOS (on macOS)
```bash
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Select your team in Signing & Capabilities
2. Product → Archive
3. Distribute App → App Store Connect
4. In App Store Connect: fill in store listing, screenshots, review notes
5. Submit for review

---

## Environment Variables Needed

Add these to your deployment environment (Vercel, etc.):

```env
# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

---

## Estimated Timeline

| Step | Effort | Can Start |
|------|--------|-----------|
| 1. Fix calendar build error | 10 min | Now |
| 2. iOS platform setup | 30 min | Need Mac + Xcode |
| 3. Developer accounts | 10 min + waiting | Now |
| 4. Firebase + push notifications | 3–4 hours | After step 3 |
| 5. Test OAuth in WebView | 30 min | After step 2 |
| 6. Deep links setup | 1 hour | After steps 2, 3 |
| 7. Status bar integration | 15 min | Now |
| 8. App assets | 1–2 hours | Before submission |
| 9. Store listings + privacy policy | 2–3 hours | Before submission |
| 10. Build and submit | 1–2 hours | After all above |
| App review | 1–7 days waiting | After submission |
