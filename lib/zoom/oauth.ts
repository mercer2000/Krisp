import sql from "./db";
import type { ZoomTokenResponse, ZoomUserOauthTokenRow } from "@/types/zoom";

export type { ZoomUserOauthTokenRow };

const ZOOM_OAUTH_URL = "https://zoom.us/oauth/token";
const ZOOM_AUTH_URL = "https://zoom.us/oauth/authorize";

/**
 * Build the Zoom OAuth authorization URL for user-managed apps.
 */
export function buildZoomAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.ZOOM_CLIENT_ID;
  if (!clientId) {
    throw new Error("ZOOM_CLIENT_ID must be configured");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  return `${ZOOM_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for tokens using Zoom OAuth.
 */
export async function exchangeZoomCode(
  code: string,
  redirectUri: string
): Promise<ZoomTokenResponse> {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET must be configured");
  }

  const response = await fetch(ZOOM_OAUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom OAuth token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh an expired Zoom access token.
 */
export async function refreshZoomToken(
  refreshToken: string
): Promise<ZoomTokenResponse> {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET must be configured");
  }

  const response = await fetch(ZOOM_OAUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Get all active Zoom OAuth token records for a tenant.
 */
export async function getZoomTokensForTenant(
  tenantId: string
): Promise<ZoomUserOauthTokenRow[]> {
  const rows = await sql`
    SELECT * FROM zoom_user_oauth_tokens
    WHERE tenant_id = ${tenantId} AND active = true
    ORDER BY created_at ASC
  `;
  return rows as ZoomUserOauthTokenRow[];
}

/**
 * Get a single active Zoom OAuth token by its ID and tenant.
 */
export async function getZoomTokenById(
  accountId: string,
  tenantId: string
): Promise<ZoomUserOauthTokenRow | null> {
  const rows = await sql`
    SELECT * FROM zoom_user_oauth_tokens
    WHERE id = ${accountId} AND tenant_id = ${tenantId} AND active = true
    LIMIT 1
  `;
  return (rows[0] as ZoomUserOauthTokenRow) || null;
}

/**
 * @deprecated Use getZoomTokensForTenant for multi-account support.
 * Get the first active Zoom OAuth token for a tenant (backwards compat for webhooks).
 */
export async function getZoomTokenForTenant(
  tenantId: string
): Promise<ZoomUserOauthTokenRow | null> {
  const rows = await sql`
    SELECT * FROM zoom_user_oauth_tokens
    WHERE tenant_id = ${tenantId} AND active = true
    LIMIT 1
  `;
  return (rows[0] as ZoomUserOauthTokenRow) || null;
}

/**
 * Upsert Zoom OAuth tokens for a tenant+email combination.
 * Multiple accounts are allowed per tenant — uniqueness is on (tenant_id, zoom_email).
 */
export async function upsertZoomTokens(params: {
  tenantId: string;
  zoomEmail: string;
  zoomUserId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}): Promise<ZoomUserOauthTokenRow> {
  const rows = await sql`
    INSERT INTO zoom_user_oauth_tokens (
      tenant_id,
      zoom_email,
      zoom_user_id,
      access_token,
      refresh_token,
      token_expiry,
      active
    ) VALUES (
      ${params.tenantId},
      ${params.zoomEmail},
      ${params.zoomUserId},
      ${params.accessToken},
      ${params.refreshToken},
      ${params.tokenExpiry.toISOString()},
      true
    )
    ON CONFLICT (tenant_id, zoom_email)
    DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expiry = EXCLUDED.token_expiry,
      zoom_user_id = EXCLUDED.zoom_user_id,
      active = true,
      updated_at = NOW()
    RETURNING *
  `;
  return rows[0] as ZoomUserOauthTokenRow;
}

/**
 * Deactivate a specific Zoom OAuth account by its ID.
 */
export async function deactivateZoomToken(
  accountId: string,
  tenantId: string
): Promise<void> {
  await sql`
    UPDATE zoom_user_oauth_tokens
    SET active = false, updated_at = NOW()
    WHERE id = ${accountId} AND tenant_id = ${tenantId}
  `;
}

/**
 * Update the last_sync_at and optional sync_cursor for a specific account.
 */
export async function updateZoomLastSync(
  accountId: string,
  syncCursor?: string
): Promise<void> {
  if (syncCursor) {
    await sql`
      UPDATE zoom_user_oauth_tokens
      SET last_sync_at = NOW(), sync_cursor = ${syncCursor}, updated_at = NOW()
      WHERE id = ${accountId} AND active = true
    `;
  } else {
    await sql`
      UPDATE zoom_user_oauth_tokens
      SET last_sync_at = NOW(), updated_at = NOW()
      WHERE id = ${accountId} AND active = true
    `;
  }
}

/**
 * Get a valid access token for a specific Zoom account, refreshing if necessary.
 */
export async function getValidZoomAccessToken(
  accountId: string,
  tenantId: string
): Promise<string> {
  const token = await getZoomTokenById(accountId, tenantId);
  if (!token) {
    throw new Error("No active Zoom OAuth token found for this account");
  }

  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  if (new Date(token.token_expiry) > fiveMinutesFromNow) {
    return token.access_token;
  }

  try {
    const refreshed = await refreshZoomToken(token.refresh_token);

    await upsertZoomTokens({
      tenantId: token.tenant_id,
      zoomEmail: token.zoom_email,
      zoomUserId: token.zoom_user_id || "",
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      tokenExpiry: new Date(Date.now() + refreshed.expires_in * 1000),
    });

    return refreshed.access_token;
  } catch (err) {
    await deactivateZoomToken(accountId, tenantId);
    throw new Error(
      "Zoom token refresh failed. Please reconnect your account. " +
      (err instanceof Error ? err.message : String(err))
    );
  }
}

/**
 * Look up the tenant ID for a given Zoom account ID (webhook backwards compat).
 * Checks both the new user_oauth_tokens table and the legacy zoom_oauth_tokens table.
 */
export async function getTenantByZoomAccountId(
  zoomAccountId: string
): Promise<string | null> {
  // Try legacy table first (admin-level webhooks use account_id)
  try {
    const legacyRows = await sql`
      SELECT tenant_id FROM zoom_oauth_tokens
      WHERE zoom_account_id = ${zoomAccountId} AND active = true
      LIMIT 1
    `;
    if (legacyRows[0]?.tenant_id) return legacyRows[0].tenant_id;
  } catch {
    // Legacy table may not exist
  }

  // Fall back to new table by zoom_user_id
  const rows = await sql`
    SELECT tenant_id FROM zoom_user_oauth_tokens
    WHERE zoom_user_id = ${zoomAccountId} AND active = true
    LIMIT 1
  `;
  return rows[0]?.tenant_id ?? null;
}
