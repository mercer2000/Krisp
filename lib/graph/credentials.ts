import { db } from "@/lib/db";
import { graphCredentials } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface GraphCredentialsInsert {
  tenantId: string;
  azureTenantId: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Save or update Azure AD app credentials for a tenant.
 * Uses atomic upsert to avoid race conditions.
 */
export async function upsertGraphCredentials(data: GraphCredentialsInsert) {
  const [result] = await db
    .insert(graphCredentials)
    .values(data)
    .onConflictDoUpdate({
      target: graphCredentials.tenantId,
      set: {
        azureTenantId: data.azureTenantId,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        updatedAt: new Date(),
      },
    })
    .returning();
  return result;
}

/**
 * Get stored Azure AD credentials for a tenant.
 */
export async function getGraphCredentials(tenantId: string) {
  const [result] = await db
    .select()
    .from(graphCredentials)
    .where(eq(graphCredentials.tenantId, tenantId));
  return result ?? null;
}

/**
 * Delete Azure AD credentials for a tenant.
 */
export async function deleteGraphCredentials(tenantId: string) {
  await db
    .delete(graphCredentials)
    .where(eq(graphCredentials.tenantId, tenantId));
}

/**
 * Obtain an access token from Azure AD using the client credentials flow.
 * This is used for application-level (daemon) access to Microsoft Graph.
 */
export async function getGraphAccessToken(tenantId: string): Promise<string> {
  const creds = await getGraphCredentials(tenantId);
  if (!creds) {
    throw new Error("No Azure AD credentials configured. Set up your Azure AD app credentials first.");
  }

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
