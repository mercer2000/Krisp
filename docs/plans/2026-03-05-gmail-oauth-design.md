# Gmail OAuth Connect Flow — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the manual Gmail token form with a one-click "Connect Gmail" OAuth flow that automatically sets up the Gmail Watch.

**Architecture:** Follow the existing Outlook OAuth pattern (`app/api/outlook/oauth/` routes). Add `GET /api/gmail/oauth` (initiates OAuth) and `GET /api/gmail/oauth/callback` (exchanges code, creates watch). Use `GOOGLE_PUBSUB_TOPIC` env var for the shared Pub/Sub topic. Update `GmailWatchManager` to use a "Connect Gmail" button instead of the manual token form.

**Tech Stack:** Next.js API routes, Google OAuth2, existing `lib/gmail/watch.ts` helpers, React client component.

---

### Task 1: Create Gmail OAuth initiation route

**Files:**
- Create: `app/api/gmail/oauth/route.ts`

**Step 1: Create the OAuth route**

Follow the pattern from `app/api/outlook/oauth/route.ts`. This route handles two concerns:
- `GET /api/gmail/oauth?action=connect` — redirects to Google OAuth consent screen
- `GET /api/gmail/oauth` (no action) — returns the current Gmail connection status

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getActiveWatch, deactivateWatch, stopGmailWatch, getValidAccessToken } from "@/lib/gmail/watch";
import { randomUUID } from "crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

function buildGmailAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly email",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const action = request.nextUrl.searchParams.get("action");

    if (action === "connect") {
      const origin = request.nextUrl.origin;
      const redirectUri = `${origin}/api/gmail/oauth/callback`;
      const state = `${userId}:${randomUUID()}`;
      const authUrl = buildGmailAuthUrl(redirectUri, state);
      return NextResponse.redirect(authUrl);
    }

    // Return connection status
    const watch = await getActiveWatch(userId);
    if (!watch) {
      return NextResponse.json({ connected: false });
    }

    const isExpired = watch.expiration
      ? new Date(watch.expiration).getTime() < Date.now()
      : false;

    return NextResponse.json({
      connected: true,
      emailAddress: watch.emailAddress,
      historyId: watch.historyId,
      expiration: watch.expiration,
      topicName: watch.topicName,
      isExpired,
      createdAt: watch.createdAt,
      updatedAt: watch.updatedAt,
    });
  } catch (error) {
    console.error("Error in Gmail OAuth route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const watch = await getActiveWatch(userId);
    if (!watch) {
      return NextResponse.json(
        { error: "No active Gmail connection found" },
        { status: 404 }
      );
    }

    // Stop watch on Google's side
    try {
      const accessToken = await getValidAccessToken(watch);
      await stopGmailWatch(accessToken);
    } catch (err) {
      console.warn("[Gmail OAuth] Failed to stop watch on Google side:", err);
    }

    await deactivateWatch(watch.id);

    return NextResponse.json({ message: "Gmail disconnected" });
  } catch (error) {
    console.error("Error disconnecting Gmail:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Gmail" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/gmail/oauth/route.ts
git commit -m "feat: add Gmail OAuth initiation route"
```

---

### Task 2: Create Gmail OAuth callback route

**Files:**
- Create: `app/api/gmail/oauth/callback/route.ts`

**Step 1: Create the callback route**

Follow the pattern from `app/api/outlook/oauth/callback/route.ts`. This exchanges the auth code for tokens, fetches the user's email from Google, and auto-creates the Gmail Watch.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { setupGmailWatch } from "@/lib/gmail/watch";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${err}`);
  }

  return res.json();
}

async function fetchGoogleUserEmail(accessToken: string): Promise<string> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user info (${res.status})`);
  }

  const data = await res.json();
  return data.email;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const code = request.nextUrl.searchParams.get("code");
    const error = request.nextUrl.searchParams.get("error");
    const errorDescription = request.nextUrl.searchParams.get("error_description");

    if (error) {
      console.error(`[Gmail OAuth] Auth error: ${error} - ${errorDescription}`);
      return NextResponse.redirect(
        new URL(
          `/admin/integrations?gmail_error=${encodeURIComponent(errorDescription || error)}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/admin/integrations?gmail_error=missing_code", request.url)
      );
    }

    // Validate state
    const state = request.nextUrl.searchParams.get("state") || "";
    const [stateUserId, stateNonce] = state.split(":");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (stateUserId !== userId || !stateNonce || !uuidRegex.test(stateNonce)) {
      return NextResponse.redirect(
        new URL("/admin/integrations?gmail_error=invalid_state", request.url)
      );
    }

    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/gmail/oauth/callback`;

    // Exchange code for tokens
    const tokenResponse = await exchangeGoogleCode(code, redirectUri);

    // Fetch user's email
    let emailAddress: string;
    try {
      emailAddress = await fetchGoogleUserEmail(tokenResponse.access_token);
      if (!emailAddress || !emailAddress.includes("@")) {
        throw new Error("Invalid email returned from Google");
      }
    } catch (err) {
      console.error("[Gmail OAuth] Failed to fetch user email:", err);
      return NextResponse.redirect(
        new URL("/admin/integrations?gmail_error=failed_to_fetch_email", request.url)
      );
    }

    // Get the shared Pub/Sub topic
    const topicName = process.env.GOOGLE_PUBSUB_TOPIC;
    if (!topicName) {
      console.error("[Gmail OAuth] GOOGLE_PUBSUB_TOPIC env var not configured");
      return NextResponse.redirect(
        new URL("/admin/integrations?gmail_error=pubsub_not_configured", request.url)
      );
    }

    // Auto-setup the Gmail Watch
    await setupGmailWatch({
      tenantId: userId,
      emailAddress,
      topicName,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiry: new Date(Date.now() + tokenResponse.expires_in * 1000),
    });

    return NextResponse.redirect(
      new URL("/admin/integrations?gmail_connected=true", request.url)
    );
  } catch (error) {
    console.error("[Gmail OAuth] Callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/admin/integrations?gmail_error=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
        request.url
      )
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/gmail/oauth/callback/route.ts
git commit -m "feat: add Gmail OAuth callback with auto watch setup"
```

---

### Task 3: Update GmailWatchManager UI

**Files:**
- Modify: `app/(app)/admin/integrations/IntegrationsClient.tsx` — the `GmailWatchManager` component (lines ~888-1190)

**Step 1: Replace the manual form with "Connect Gmail" button**

In the `GmailWatchManager` component:

1. **Remove** the `setupForm` state and `handleSetup` function (manual token/topic inputs)
2. **Replace** the "Set Up Gmail Watch" / form section with a single "Connect Gmail" button that navigates to `/api/gmail/oauth?action=connect`
3. **Add** a `useEffect` to check for `gmail_connected=true` and `gmail_error` URL params (same pattern as Zoom/Outlook managers)
4. **Keep** the existing active watch display, renew button, and stop/disconnect button

The "No Active Watch" state should show:
```
Connect your Gmail account to automatically monitor your inbox.
[Connect Gmail] button
```

The "Active Watch" state keeps the existing status card with email, topic, history ID, expiration, and the Renew/Disconnect buttons.

**Step 2: Simplify the Gmail section instructions**

In the main Gmail tab section (lines ~2684-2997), remove or collapse the multi-step manual Pub/Sub setup instructions (Setup Option A steps 1-7). Replace with a brief note that the OAuth flow handles everything automatically, and keep the Apps Script fallback as "Setup Option B" for users who prefer polling.

**Step 3: Commit**

```bash
git add app/(app)/admin/integrations/IntegrationsClient.tsx
git commit -m "feat: replace manual Gmail token form with Connect Gmail OAuth button"
```

---

### Task 4: Test the full flow

**Step 1: Verify env vars**

Ensure these are set in `.env.local`:
- `GOOGLE_CLIENT_ID` — from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `GOOGLE_PUBSUB_TOPIC` — e.g. `projects/my-project/topics/gmail-inbound`

And that the OAuth consent screen in Google Cloud Console has:
- `http://localhost:3000/api/gmail/oauth/callback` as an authorized redirect URI

**Step 2: Manual test**

1. Go to `/admin/integrations` and click the Gmail tab
2. Click "Connect Gmail"
3. Verify redirect to Google OAuth consent screen
4. Grant permission
5. Verify redirect back to integrations page with success message
6. Verify watch status shows connected with email, expiration, etc.
7. Test "Renew Watch" button
8. Test "Disconnect" button

**Step 3: Commit any fixes**
