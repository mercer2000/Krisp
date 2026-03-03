import sql from "./db";
import type { ZoomOauthTokenRow, ZoomTokenResponse } from "@/types/zoom";

const ZOOM_OAUTH_URL = "https://zoom.us/oauth/token";

/**
 * Get the active Zoom OAuth token record for a tenant.
 */
export async function getZoomTokenForTenant(
  tenantId: string
): Promise<ZoomOauthTokenRow | null> {
  const rows = await sql`
    SELECT * FROM zoom_oauth_tokens
    WHERE tenant_id = ${tenantId} AND active = true
    LIMIT 1
  `;
  return (rows[0] as ZoomOauthTokenRow) || null;
}

/**
 * Upsert Zoom OAuth tokens for a tenant.
 * If a record already exists, update it. Otherwise, insert a new one.
 */
export async function upsertZoomTokens(params: {
  tenantId: string;
  zoomAccountId?: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}): Promise<ZoomOauthTokenRow> {
  const rows = await sql`
    INSERT INTO zoom_oauth_tokens (
      tenant_id,
      zoom_account_id,
      access_token,
      refresh_token,
      token_expiry,
      active
    ) VALUES (
      ${params.tenantId},
      ${params.zoomAccountId ?? null},
      ${params.accessToken},
      ${params.refreshToken},
      ${params.tokenExpiry.toISOString()},
      true
    )
    ON CONFLICT (tenant_id)
    DO UPDATE SET
      zoom_account_id = COALESCE(EXCLUDED.zoom_account_id, zoom_oauth_tokens.zoom_account_id),
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expiry = EXCLUDED.token_expiry,
      active = true,
      updated_at = NOW()
    RETURNING *
  `;
  return rows[0] as ZoomOauthTokenRow;
}

/**
 * Deactivate Zoom OAuth token for a tenant.
 */
export async function deactivateZoomToken(
  tenantId: string
): Promise<void> {
  await sql`
    UPDATE zoom_oauth_tokens
    SET active = false, updated_at = NOW()
    WHERE tenant_id = ${tenantId}
  `;
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
 * Get a valid access token for a tenant, refreshing if necessary.
 * Returns the access token string, or throws if refresh fails.
 */
export async function getValidZoomAccessToken(
  tenantId: string
): Promise<string> {
  const token = await getZoomTokenForTenant(tenantId);
  if (!token) {
    throw new Error("No active Zoom OAuth token found for this tenant");
  }

  // Check if token expires within 5 minutes
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  if (new Date(token.token_expiry) > fiveMinutesFromNow) {
    return token.access_token;
  }

  // Token is expired or about to expire — refresh it
  const refreshed = await refreshZoomToken(token.refresh_token);

  await upsertZoomTokens({
    tenantId,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    tokenExpiry: new Date(Date.now() + refreshed.expires_in * 1000),
  });

  return refreshed.access_token;
}

/**
 * Look up the tenant ID for a given Zoom account ID.
 * Used by webhooks to map Zoom account → tenant.
 */
export async function getTenantByZoomAccountId(
  zoomAccountId: string
): Promise<string | null> {
  const rows = await sql`
    SELECT tenant_id FROM zoom_oauth_tokens
    WHERE zoom_account_id = ${zoomAccountId} AND active = true
    LIMIT 1
  `;
  return rows[0]?.tenant_id ?? null;
}
