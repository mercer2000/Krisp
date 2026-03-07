import sql from "./db";

export interface GoogleOauthTokenRow {
  id: string;
  tenant_id: string;
  google_email: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

/**
 * Build the Google OAuth authorization URL.
 */
export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID must be configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for tokens using Google OAuth.
 */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be configured"
    );
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
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
    throw new Error(`Google OAuth token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh an expired Google access token.
 */
export async function refreshGoogleToken(
  refreshToken: string
): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be configured"
    );
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Fetch the authenticated user's email from Google userinfo.
 */
export async function fetchGoogleUserEmail(
  accessToken: string
): Promise<string> {
  const res = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch Google user info: ${res.status}`);
  }

  const data: { email?: string } = await res.json();
  if (!data.email) {
    throw new Error("No email in Google userinfo response");
  }
  return data.email;
}

/**
 * Get all active Google OAuth token records for a tenant.
 */
export async function getGoogleTokensForTenant(
  tenantId: string
): Promise<GoogleOauthTokenRow[]> {
  const rows = await sql`
    SELECT * FROM google_oauth_tokens
    WHERE tenant_id = ${tenantId} AND active = true
    ORDER BY created_at ASC
  `;
  return rows as GoogleOauthTokenRow[];
}

/**
 * Get a single active Google OAuth token by its ID and tenant.
 */
export async function getGoogleTokenById(
  accountId: string,
  tenantId: string
): Promise<GoogleOauthTokenRow | null> {
  const rows = await sql`
    SELECT * FROM google_oauth_tokens
    WHERE id = ${accountId} AND tenant_id = ${tenantId} AND active = true
    LIMIT 1
  `;
  return (rows[0] as GoogleOauthTokenRow) || null;
}

/**
 * Upsert Google OAuth tokens for a tenant+email combination.
 * Multiple accounts are allowed per tenant — uniqueness is on (tenant_id, google_email).
 */
export async function upsertGoogleTokens(params: {
  tenantId: string;
  googleEmail: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}): Promise<GoogleOauthTokenRow> {
  const rows = await sql`
    INSERT INTO google_oauth_tokens (
      tenant_id,
      google_email,
      access_token,
      refresh_token,
      token_expiry,
      active
    ) VALUES (
      ${params.tenantId},
      ${params.googleEmail},
      ${params.accessToken},
      ${params.refreshToken},
      ${params.tokenExpiry.toISOString()},
      true
    )
    ON CONFLICT (tenant_id, google_email)
    DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expiry = EXCLUDED.token_expiry,
      active = true,
      updated_at = NOW()
    RETURNING *
  `;
  return rows[0] as GoogleOauthTokenRow;
}

/**
 * Deactivate a specific Google OAuth account by its ID.
 */
export async function deactivateGoogleToken(
  accountId: string,
  tenantId: string
): Promise<void> {
  await sql`
    UPDATE google_oauth_tokens
    SET active = false, updated_at = NOW()
    WHERE id = ${accountId} AND tenant_id = ${tenantId}
  `;
}

/**
 * Update the last_sync_at timestamp for a specific account.
 */
export async function updateGoogleLastSync(
  accountId: string
): Promise<void> {
  await sql`
    UPDATE google_oauth_tokens
    SET last_sync_at = NOW(), updated_at = NOW()
    WHERE id = ${accountId} AND active = true
  `;
}

/**
 * Get a valid access token for a specific Google account, refreshing if necessary.
 */
export async function getValidGoogleAccessToken(
  accountId: string,
  tenantId: string
): Promise<string> {
  const token = await getGoogleTokenById(accountId, tenantId);
  if (!token) {
    throw new Error("No active Google OAuth token found for this account");
  }

  // Check if token expires within 5 minutes
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  if (new Date(token.token_expiry) > fiveMinutesFromNow) {
    return token.access_token;
  }

  // Token is expired or about to expire — refresh it
  try {
    const refreshed = await refreshGoogleToken(token.refresh_token);

    await upsertGoogleTokens({
      tenantId: token.tenant_id,
      googleEmail: token.google_email,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token || token.refresh_token,
      tokenExpiry: new Date(Date.now() + refreshed.expires_in * 1000),
    });

    return refreshed.access_token;
  } catch (err) {
    // Refresh token may be revoked — deactivate so user sees they need to reconnect
    await deactivateGoogleToken(accountId, tenantId);
    throw new Error(
      "Google token refresh failed. Please reconnect your account. " +
        (err instanceof Error ? err.message : String(err))
    );
  }
}
