import sql from "./db";

export interface OutlookOauthTokenRow {
  id: string;
  tenant_id: string;
  outlook_email: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MicrosoftTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

const MS_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MS_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";

/**
 * Build the Microsoft OAuth authorization URL for personal accounts.
 */
export function buildOutlookAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.OAUTH_OUTLOOK_CLIENT_ID;
  if (!clientId) {
    throw new Error("OAUTH_OUTLOOK_CLIENT_ID must be configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: "openid profile email Mail.Read Mail.ReadWrite Calendars.Read offline_access User.Read",
    state,
    prompt: "consent",
  });

  return `${MS_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for tokens using Microsoft identity platform.
 */
export async function exchangeOutlookCode(
  code: string,
  redirectUri: string
): Promise<MicrosoftTokenResponse> {
  const clientId = process.env.OAUTH_OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OAUTH_OUTLOOK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("OAUTH_OUTLOOK_CLIENT_ID and OAUTH_OUTLOOK_CLIENT_SECRET must be configured");
  }

  const response = await fetch(MS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Microsoft OAuth token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh an expired Microsoft access token.
 */
export async function refreshOutlookToken(
  refreshToken: string
): Promise<MicrosoftTokenResponse> {
  const clientId = process.env.OAUTH_OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OAUTH_OUTLOOK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("OAUTH_OUTLOOK_CLIENT_ID and OAUTH_OUTLOOK_CLIENT_SECRET must be configured");
  }

  const response = await fetch(MS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: "openid profile email Mail.Read Mail.ReadWrite Calendars.Read offline_access User.Read",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Microsoft token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Get all active Outlook OAuth token records for a tenant.
 */
export async function getOutlookTokensForTenant(
  tenantId: string
): Promise<OutlookOauthTokenRow[]> {
  const rows = await sql`
    SELECT * FROM outlook_oauth_tokens
    WHERE tenant_id = ${tenantId} AND active = true
    ORDER BY created_at ASC
  `;
  return rows as OutlookOauthTokenRow[];
}

/**
 * Get a single active Outlook OAuth token by its ID and tenant.
 */
export async function getOutlookTokenById(
  accountId: string,
  tenantId: string
): Promise<OutlookOauthTokenRow | null> {
  const rows = await sql`
    SELECT * FROM outlook_oauth_tokens
    WHERE id = ${accountId} AND tenant_id = ${tenantId} AND active = true
    LIMIT 1
  `;
  return (rows[0] as OutlookOauthTokenRow) || null;
}

/**
 * @deprecated Use getOutlookTokensForTenant for multi-account support.
 * Get the first active Outlook OAuth token record for a tenant (backwards compat).
 */
export async function getOutlookTokenForTenant(
  tenantId: string
): Promise<OutlookOauthTokenRow | null> {
  const rows = await sql`
    SELECT * FROM outlook_oauth_tokens
    WHERE tenant_id = ${tenantId} AND active = true
    LIMIT 1
  `;
  return (rows[0] as OutlookOauthTokenRow) || null;
}

/**
 * Upsert Outlook OAuth tokens for a tenant+email combination.
 * Multiple accounts are allowed per tenant — uniqueness is on (tenant_id, outlook_email).
 */
export async function upsertOutlookTokens(params: {
  tenantId: string;
  outlookEmail: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}): Promise<OutlookOauthTokenRow> {
  const rows = await sql`
    INSERT INTO outlook_oauth_tokens (
      tenant_id,
      outlook_email,
      access_token,
      refresh_token,
      token_expiry,
      active
    ) VALUES (
      ${params.tenantId},
      ${params.outlookEmail},
      ${params.accessToken},
      ${params.refreshToken},
      ${params.tokenExpiry.toISOString()},
      true
    )
    ON CONFLICT (tenant_id, outlook_email)
    DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expiry = EXCLUDED.token_expiry,
      active = true,
      updated_at = NOW()
    RETURNING *
  `;
  return rows[0] as OutlookOauthTokenRow;
}

/**
 * Deactivate a specific Outlook OAuth account by its ID.
 */
export async function deactivateOutlookToken(
  accountId: string,
  tenantId: string
): Promise<void> {
  await sql`
    UPDATE outlook_oauth_tokens
    SET active = false, updated_at = NOW()
    WHERE id = ${accountId} AND tenant_id = ${tenantId}
  `;
}

/**
 * Deactivate all Outlook OAuth tokens for a tenant.
 */
export async function deactivateAllOutlookTokens(
  tenantId: string
): Promise<void> {
  await sql`
    UPDATE outlook_oauth_tokens
    SET active = false, updated_at = NOW()
    WHERE tenant_id = ${tenantId}
  `;
}

/**
 * Update the last_sync_at timestamp for a specific account.
 */
export async function updateOutlookLastSync(
  accountId: string
): Promise<void> {
  await sql`
    UPDATE outlook_oauth_tokens
    SET last_sync_at = NOW(), updated_at = NOW()
    WHERE id = ${accountId} AND active = true
  `;
}

/**
 * Get a valid access token for a specific Outlook account, refreshing if necessary.
 */
export async function getValidOutlookAccessToken(
  accountId: string,
  tenantId: string
): Promise<string> {
  const token = await getOutlookTokenById(accountId, tenantId);
  if (!token) {
    throw new Error("No active Outlook OAuth token found for this account");
  }

  // Check if token expires within 5 minutes
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  if (new Date(token.token_expiry) > fiveMinutesFromNow) {
    return token.access_token;
  }

  // Token is expired or about to expire — refresh it
  try {
    const refreshed = await refreshOutlookToken(token.refresh_token);

    await upsertOutlookTokens({
      tenantId: token.tenant_id,
      outlookEmail: token.outlook_email,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      tokenExpiry: new Date(Date.now() + refreshed.expires_in * 1000),
    });

    return refreshed.access_token;
  } catch (err) {
    // Refresh token may be revoked — deactivate so user sees they need to reconnect
    await deactivateOutlookToken(accountId, tenantId);
    throw new Error(
      "Outlook token refresh failed. Please reconnect your account. " +
      (err instanceof Error ? err.message : String(err))
    );
  }
}
