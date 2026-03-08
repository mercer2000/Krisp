# Neon Auth Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace NextAuth v5 with Neon Auth for email/password + Google OAuth login, keeping existing `users` table with auto-sync.

**Architecture:** Neon Auth SDK handles sign-in/sign-up/OAuth via REST API, stores auth data in `neon_auth` schema. On first login, auto-create a row in app's `users` table with `id = neonAuth.user.id`. RLS policies updated from `auth.user_id()` to `auth.uid()`. Session cookie changes from `authjs.session-token` to `__Secure-neonauth.session_token`.

**Tech Stack:** `@neondatabase/auth`, Neon Auth service, Better Auth (underlying), Drizzle ORM, Next.js 16

---

### Task 1: Install Neon Auth SDK and remove NextAuth

**Files:**
- Modify: `package.json`

**Step 1: Install @neondatabase/auth and remove next-auth**

Run:
```bash
npm install @neondatabase/auth@latest
npm uninstall next-auth
```

**Step 2: Verify installation**

Run: `npm ls @neondatabase/auth`
Expected: Shows installed version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @neondatabase/auth, remove next-auth"
```

---

### Task 2: Create Neon Auth server and client instances

**Files:**
- Rewrite: `lib/auth/server.ts` (new file, replaces getRequiredUser pattern)
- Create: `lib/auth/client.ts`
- Delete: `auth.ts` (old NextAuth config)

**Step 1: Create server auth instance**

Create `lib/auth/server.ts`:
```typescript
import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});
```

**Step 2: Create client auth instance**

Create `lib/auth/client.ts`:
```typescript
'use client';

import { createAuthClient } from '@neondatabase/auth/next';

export const authClient = createAuthClient();
```

**Step 3: Delete old auth.ts**

Delete `auth.ts` (root level NextAuth config with RS256 JWT encode/decode).

**Step 4: Commit**

```bash
git add lib/auth/server.ts lib/auth/client.ts
git rm auth.ts
git commit -m "feat: add Neon Auth server/client instances, remove NextAuth config"
```

---

### Task 3: Create Neon Auth API route handler

**Files:**
- Create: `app/api/auth/[...path]/route.ts`
- Delete: `app/api/auth/[...nextauth]/route.ts`
- Delete: `app/api/auth/health/route.ts` (RS256 key diagnostic, no longer needed)

**Step 1: Create catch-all auth route**

Create `app/api/auth/[...path]/route.ts`:
```typescript
import { auth } from '@/lib/auth/server';

export const { GET, POST } = auth.handler();
```

**Step 2: Delete old NextAuth handler and health check**

Delete `app/api/auth/[...nextauth]/route.ts`
Delete `app/api/auth/health/route.ts`

**Step 3: Commit**

```bash
git add "app/api/auth/[...path]/route.ts"
git rm "app/api/auth/[...nextauth]/route.ts"
git rm "app/api/auth/health/route.ts"
git commit -m "feat: replace NextAuth handler with Neon Auth handler"
```

---

### Task 4: Update middleware

**Files:**
- Rewrite: `middleware.ts`

**Step 1: Replace middleware with Neon Auth middleware**

Rewrite `middleware.ts`:
```typescript
import { auth } from '@/lib/auth/server';

export default auth.middleware({
  loginUrl: '/auth/sign-in',
});

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|images/|favicon.ico|auth/).*)',
    // Public pages that don't need auth are handled by middleware itself
  ],
};
```

Note: The Neon Auth middleware automatically handles:
- Redirecting unauthenticated users to loginUrl
- Validating session cookies
- Refreshing expired tokens

Marketing pages (`/`, `/pricing`, `/checkout`) need to be accessible without auth. Check if Neon Auth middleware has a way to whitelist routes, or adjust the matcher to exclude them.

**Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: replace NextAuth middleware with Neon Auth middleware"
```

---

### Task 5: Create auth pages (sign-in, sign-up, sign-out)

**Files:**
- Create: `app/auth/[path]/page.tsx`
- Create: `app/account/[path]/page.tsx`
- Delete: `app/(auth)/login/page.tsx`
- Delete: `app/(auth)/register/page.tsx`
- Delete: `app/(auth)/forgot-password/page.tsx`
- Delete: `app/(auth)/reset-password/page.tsx`
- Delete: `app/(auth)/layout.tsx`

**Step 1: Create auth pages**

Create `app/auth/[path]/page.tsx`:
```tsx
import { AuthView } from '@neondatabase/auth/react';

export const dynamicParams = false;

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <AuthView path={path} />
    </main>
  );
}
```

**Step 2: Create account management pages**

Create `app/account/[path]/page.tsx`:
```tsx
import { AccountView } from '@neondatabase/auth/react';
import { accountViewPaths } from '@neondatabase/auth/react/ui/server';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

export default async function AccountPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;

  return (
    <main className="container p-4 md:p-6">
      <AccountView path={path} />
    </main>
  );
}
```

**Step 3: Delete old auth pages**

Delete the entire `app/(auth)/` directory.

**Step 4: Commit**

```bash
git add "app/auth/[path]/page.tsx" "app/account/[path]/page.tsx"
git rm -r "app/(auth)/"
git commit -m "feat: replace custom auth pages with Neon Auth AuthView/AccountView"
```

---

### Task 6: Update providers and layout

**Files:**
- Modify: `app/providers.tsx` — remove `SessionProvider` from next-auth, add `NeonAuthUIProvider`
- Modify: `app/globals.css` — add Neon Auth UI styles
- Modify: `app/layout.tsx` — if needed

**Step 1: Update providers.tsx**

Replace `SessionProvider` from `next-auth/react` with `NeonAuthUIProvider`:
```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import { authClient } from "@/lib/auth/client";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <NeonAuthUIProvider authClient={authClient} emailOTP>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </NeonAuthUIProvider>
  );
}
```

**Step 2: Add Neon Auth UI styles to globals.css**

Add after the `@import "tailwindcss";` line:
```css
@import "@neondatabase/auth/ui/tailwind";
```

**Step 3: Commit**

```bash
git add app/providers.tsx app/globals.css
git commit -m "feat: replace SessionProvider with NeonAuthUIProvider"
```

---

### Task 7: Update getRequiredUser and getRequiredAdmin

**Files:**
- Rewrite: `lib/auth/getRequiredUser.ts`
- Modify: `lib/auth/getRequiredAdmin.ts`

**Step 1: Rewrite getRequiredUser**

This is the most important change — all ~130 API routes use this function. It must:
1. Get the Neon Auth session
2. Auto-create a `users` row if it doesn't exist (user sync)
3. Return `{ id, name, email }` same as before

```typescript
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getRequiredUser(): Promise<{ id: string; name?: string | null; email?: string | null }> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) redirect("/auth/sign-in");

  const neonUserId = session.user.id;
  const name = session.user.name;
  const email = session.user.email;

  // Auto-sync: ensure user exists in our users table
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, neonUserId));

  if (!existing) {
    await db.insert(users).values({
      id: neonUserId,
      username: email ?? neonUserId,
      email: email ?? "",
      displayName: name ?? email ?? "User",
    }).onConflictDoNothing();
  }

  return { id: neonUserId, name, email };
}
```

**Step 2: Update getRequiredAdmin**

```typescript
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getRequiredAdmin(): Promise<{ id: string; name?: string | null; email?: string | null }> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) redirect("/auth/sign-in");

  const neonUserId = session.user.id;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, neonUserId));

  if (!user || user.role !== "admin") redirect("/boards");

  return { id: neonUserId, name: session.user.name, email: session.user.email };
}
```

**Step 3: Commit**

```bash
git add lib/auth/getRequiredUser.ts lib/auth/getRequiredAdmin.ts
git commit -m "feat: rewrite getRequiredUser/Admin for Neon Auth with auto-sync"
```

---

### Task 8: Update authDb.ts for Neon Auth session token

**Files:**
- Modify: `lib/db/authDb.ts`

**Step 1: Update cookie name and token retrieval**

The Neon Auth session cookie is `__Secure-neonauth.session_token`. However, for RLS we need the JWT access token, not the session cookie. We need to get it from the session.

```typescript
import { auth } from "@/lib/auth/server";
import { db } from "./index";

/**
 * Returns a Drizzle db instance with the user's JWT auth token attached.
 * Neon Auth validates the JWT and enforces RLS policies using auth.uid().
 */
export async function getAuthDb() {
  const { data: session } = await auth.getSession();

  if (!session?.session?.token) {
    throw new Error("No session token found");
  }

  // Use the session token for RLS
  return db.$withAuth(session.session.token);
}
```

Note: Need to verify at runtime whether `session.session.token` or `session.access_token` is the correct JWT to pass to `$withAuth()`. The Neon Auth session object structure may vary — check the actual response.

**Step 2: Update lib/krisp/db.ts getAuthSql similarly**

```typescript
import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";

const sql = neon(process.env.DATABASE_URL!);

export default sql;

/**
 * Returns a neon() sql tagged template with the user's auth token attached.
 * RLS policies are enforced by Neon's proxy via the JWT.
 */
export async function getAuthSql() {
  const { data: session } = await auth.getSession();
  if (!session?.session?.token) {
    throw new Error("No session token found");
  }
  return neon(process.env.DATABASE_URL!, { authToken: session.session.token });
}
```

Note: `getAuthSql` signature changes from `(token: string)` to `()` — callers no longer pass a token. Check all callers.

**Step 3: Commit**

```bash
git add lib/db/authDb.ts lib/krisp/db.ts
git commit -m "feat: update authDb and krisp db to use Neon Auth session tokens"
```

---

### Task 9: Update SideNav signOut

**Files:**
- Modify: `components/ui/SideNav.tsx`

**Step 1: Replace next-auth signOut with Neon Auth**

Change line 6 from:
```typescript
import { signOut } from "next-auth/react";
```
to:
```typescript
import { authClient } from "@/lib/auth/client";
```

Change the signOut call (around line 738) from:
```typescript
onClick={() => signOut({ callbackUrl: "/login" })}
```
to:
```typescript
onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => window.location.href = "/auth/sign-in" } })}
```

**Step 2: Commit**

```bash
git add components/ui/SideNav.tsx
git commit -m "feat: replace next-auth signOut with Neon Auth client signOut"
```

---

### Task 10: Delete old auth API routes and JWKS endpoint

**Files:**
- Delete: `app/api/v1/auth/register/route.ts`
- Delete: `app/api/v1/auth/forgot-password/route.ts`
- Delete: `app/api/v1/auth/reset-password/route.ts`
- Delete: `app/.well-known/jwks.json/route.ts`

**Step 1: Delete old auth routes**

These are all handled by Neon Auth now:
- Registration → `/auth/sign-up`
- Forgot password → Neon Auth handles email verification/reset
- JWKS → Neon Auth manages its own JWKS

**Step 2: Commit**

```bash
git rm "app/api/v1/auth/register/route.ts"
git rm "app/api/v1/auth/forgot-password/route.ts"
git rm "app/api/v1/auth/reset-password/route.ts"
git rm "app/.well-known/jwks.json/route.ts"
git commit -m "chore: remove old auth routes replaced by Neon Auth"
```

---

### Task 11: Update RLS policies from auth.user_id() to auth.uid()

**Files:**
- Modify: `lib/db/schema.ts` (line 28, `authUid` helper)
- Create: `drizzle/migrations/XXXX_update-rls-auth-uid.sql`

**Step 1: Update the authUid helper in schema.ts**

Change line 27-28 from:
```typescript
const authUid = (userIdColumn: AnyPgColumn): SQL =>
  sql`(select auth.user_id()::uuid = ${userIdColumn})`;
```
to:
```typescript
const authUid = (userIdColumn: AnyPgColumn): SQL =>
  sql`(select auth.uid()::uuid = ${userIdColumn})`;
```

Note: If `auth.uid()` already returns uuid, the `::uuid` cast is harmless. Keep it for safety.

**Step 2: Generate migration for RLS policy changes**

Run: `npx drizzle-kit generate`

If drizzle-kit doesn't detect RLS policy function changes, create a manual migration that updates all policies. The migration needs to replace `auth.user_id()` with `auth.uid()` in every policy.

**Step 3: Also update any raw SQL RLS policies (pgPolicy with subqueries)**

Search schema.ts for any `pgPolicy` that uses `auth.user_id()` directly in SQL strings and update those too.

**Step 4: Commit**

```bash
git add lib/db/schema.ts drizzle/migrations/
git commit -m "feat: update RLS policies from auth.user_id() to auth.uid()"
```

---

### Task 12: Update environment variables

**Step 1: Add new env vars to .env.local**

```
NEON_AUTH_BASE_URL=<get from Neon Console → Project → Auth → Configuration>
NEON_AUTH_COOKIE_SECRET=<run: openssl rand -base64 32>
```

**Step 2: Remove old env vars (can keep temporarily, they're just unused)**

```
AUTH_PRIVATE_KEY     — no longer needed
AUTH_PUBLIC_JWK      — no longer needed
AUTH_SECRET          — no longer needed
```

**Step 3: Add env vars to Vercel**

In Vercel dashboard, add `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET`.
Remove `AUTH_PRIVATE_KEY`, `AUTH_PUBLIC_JWK`, `AUTH_SECRET`.

**Step 4: Enable Neon Auth in Neon Console**

Go to Neon Console → Project → Auth → Enable.
Enable Google OAuth provider (Neon provides test credentials out of the box).
Copy the Auth URL for `NEON_AUTH_BASE_URL`.

---

### Task 13: Clean up unused dependencies and files

**Files:**
- Modify: `package.json` — remove `jose`, `bcryptjs`, `@types/bcryptjs` if not used elsewhere
- Modify: `lib/validators/schemas.ts` — remove `loginSchema`, `registerSchema`, `forgotPasswordSchema`, `resetPasswordSchema` if unused

**Step 1: Check if jose/bcryptjs are used elsewhere**

Search for imports of `jose` and `bcryptjs` outside of auth files. If not used, remove them.

**Step 2: Remove unused validator schemas**

Check if `loginSchema`, `registerSchema` etc. are imported anywhere besides the deleted auth files.

**Step 3: Commit**

```bash
git add package.json package-lock.json lib/validators/schemas.ts
git commit -m "chore: remove unused auth dependencies and schemas"
```

---

### Task 14: Build and test

**Step 1: Run build**

```bash
npm run build
```

Fix any import errors from removed files/packages.

**Step 2: Test locally**

```bash
npm run dev
```

- Visit `/auth/sign-in` — should show Neon Auth sign-in form
- Create account with email/password
- Verify redirect to `/boards` or `/dashboard`
- Check that `users` table has auto-created row
- Test sign-out from SideNav
- Test Google OAuth (if configured)

**Step 3: Commit any fixes and push**

```bash
git add -A
git commit -m "fix: resolve build issues from Neon Auth migration"
git push
```

---

## Important Notes

- **~130 API routes use `getRequiredUser()`** — the function signature stays the same (`() => Promise<{ id, name, email }>`), so no changes needed in those files.
- **`getAuthSql()` signature changes** — from `(token: string)` to `()`. Search for all callers and update them.
- **User IDs change** — new Neon Auth user IDs won't match old NextAuth user IDs. Since this is a clean start with only one user, this is fine.
- **`users.username` and `users.passwordHash`** — username becomes email-based, passwordHash becomes null (Neon Auth manages passwords). May want to make these columns nullable if not already.
- **Marketing pages** — `/`, `/pricing`, `/checkout` need to remain public. Verify middleware matcher excludes them.
