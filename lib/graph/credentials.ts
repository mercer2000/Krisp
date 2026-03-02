import { db } from "@/lib/db";
import { graphCredentials } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export interface GraphCredentialsInsert {
  tenantId: string;
  label: string;
  azureTenantId: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Create new Azure AD app credentials for a tenant.
 */
export async function createGraphCredentials(data: GraphCredentialsInsert) {
  const [result] = await db
    .insert(graphCredentials)
    .values(data)
    .returning();
  return result;
}

/**
 * Update existing Azure AD app credentials.
 */
export async function updateGraphCredentials(
  id: string,
  tenantId: string,
  data: Partial<Pick<GraphCredentialsInsert, "label" | "azureTenantId" | "clientId" | "clientSecret">>
) {
  const [result] = await db
    .update(graphCredentials)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(graphCredentials.id, id),
        eq(graphCredentials.tenantId, tenantId)
      )
    )
    .returning();
  return result ?? null;
}

/**
 * Get all Azure AD credentials for a tenant.
 */
export async function getAllGraphCredentials(tenantId: string) {
  return db
    .select()
    .from(graphCredentials)
    .where(eq(graphCredentials.tenantId, tenantId));
}

/**
 * Get a specific credential by ID, scoped to tenant.
 */
export async function getGraphCredentialsById(id: string, tenantId: string) {
  const [result] = await db
    .select()
    .from(graphCredentials)
    .where(
      and(
        eq(graphCredentials.id, id),
        eq(graphCredentials.tenantId, tenantId)
      )
    );
  return result ?? null;
}

/**
 * Get a credential by ID (no tenant scoping — for webhook handler use).
 */
export async function getGraphCredentialsByIdUnsafe(id: string) {
  const [result] = await db
    .select()
    .from(graphCredentials)
    .where(eq(graphCredentials.id, id));
  return result ?? null;
}

/**
 * Delete Azure AD credentials for a tenant.
 */
export async function deleteGraphCredentials(id: string, tenantId: string) {
  await db
    .delete(graphCredentials)
    .where(
      and(
        eq(graphCredentials.id, id),
        eq(graphCredentials.tenantId, tenantId)
      )
    );
}

/**
 * Obtain an access token from Azure AD using the client credentials flow.
 * Accepts the credential record directly to avoid extra DB lookups.
 */
export async function getGraphAccessTokenFromCreds(creds: {
  azureTenantId: string;
  clientId: string;
  clientSecret: string;
}): Promise<string> {
  // Validate stored tenant ID format to prevent SSRF via URL injection
  const guidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(creds.azureTenantId)) {
    throw new Error("Stored Azure Tenant ID is invalid. Please update your credentials.");
  }

  const tokenUrl = `https://login.microsoftonline.com/${creds.azureTenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let detail: string;
    try {
      const parsed = JSON.parse(errorBody);
      detail = parsed.error_description || parsed.error || errorBody;
    } catch {
      detail = errorBody;
    }
    throw new Error(`Azure AD token request failed: ${detail}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Get an access token for a specific credential by ID (tenant-scoped).
 */
export async function getGraphAccessToken(credentialId: string, tenantId: string): Promise<string> {
  const creds = await getGraphCredentialsById(credentialId, tenantId);
  if (!creds) {
    throw new Error("Credential not found. Set up your Azure AD app credentials first.");
  }
  return getGraphAccessTokenFromCreds(creds);
}
