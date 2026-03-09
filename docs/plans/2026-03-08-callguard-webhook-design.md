# CallGuard Desktop Auth & Transcript Webhook Design

## Overview

Enable the CallGuard desktop app to authenticate via the MyOpenBrain web app and POST transcription data via webhook.

## Flow

1. User clicks "Sign In" in CallGuard settings
2. WebView opens `/auth/sign-in`
3. User logs in (email/password or Google)
4. After login, CallGuard navigates WebView to `/auth/callback-desktop`
5. Route handler returns JSON with JWT access token and user info
6. CallGuard captures token, closes WebView, stores token encrypted locally
7. After each transcription, CallGuard POSTs to `/api/webhooks/transcript` with `Authorization: Bearer <token>`
8. On failure, retries up to 3 times with exponential backoff

## Callback Route

**`app/auth/callback-desktop/route.ts`** — GET route handler

- Calls `auth.getSession()` (cookie exists since user just logged in)
- Returns JSON: `{ "access_token": "<jwt>", "user": { "id": "<id>", "email": "<email>" } }`
- Returns 401 if no valid session

## Transcript Webhook Endpoint

**`app/api/webhooks/transcript/route.ts`** — POST only

1. Extract `Authorization: Bearer <token>` from headers
2. Verify JWT using `jose` `jwtVerify()` against JWKS from `{NEON_AUTH_BASE_URL}/.well-known/jwks.json` (cached via `createRemoteJWKSet`)
3. Extract `sub` claim as userId
4. Validate request body
5. Insert into `transcripts` table
6. Return 201 with `{ id: "<transcript_id>" }`

Error responses: 401 (auth), 400 (payload), 500 (server)

## Database Schema

New `transcripts` table:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default random |
| userId | uuid | FK to users |
| recordingId | text | From CallGuard |
| application | text | e.g. "Zoom" |
| startTimeUtc | timestamp | Meeting start |
| endTimeUtc | timestamp | Meeting end |
| duration | text | e.g. "00:30:00" |
| modelName | text | e.g. "base.en" |
| language | text | e.g. "en" |
| fullText | text | Full transcript |
| segments | jsonb | Array of { start, end, text } |
| createdAt | timestamp | Default now |

RLS: `crudPolicy` on userId — users can only access their own transcripts.

## Files to Create/Modify

| File | Action |
|------|--------|
| `app/auth/callback-desktop/route.ts` | Create |
| `app/api/webhooks/transcript/route.ts` | Create |
| `lib/db/schema.ts` | Modify — add transcripts table |
| `drizzle/migrations/0041_callguard-transcripts.sql` | Create |

## New Dependency

- `jose` — JWT verification with JWKS

## Not In Scope

- CallGuard C# components (AuthService, WebhookService, LoginWindow, queue)
- AI processing of transcripts
- Outbound webhook dispatch
- Token refresh endpoint
