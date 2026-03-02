import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  upsertGraphCredentials,
  getGraphCredentials,
  deleteGraphCredentials,
  getGraphAccessToken,
} from "@/lib/graph/credentials";

/**
 * GET /api/graph/credentials
 * Check if Azure AD credentials are configured for the current user.
 * Returns masked client ID and azure tenant ID (never the secret).
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creds = await getGraphCredentials(userId);
    if (!creds) {
      return NextResponse.json({ configured: false });
    }

    return NextResponse.json({
      configured: true,
      azureTenantId: creds.azureTenantId,
      clientId: creds.clientId,
      // Never return the client secret — mask safely
      clientSecretHint:
        creds.clientSecret.length > 8
          ? creds.clientSecret.slice(0, 4) + "..." + creds.clientSecret.slice(-4)
          : "****",
      updatedAt: creds.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching Graph credentials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/graph/credentials
 * Save Azure AD app credentials for the current user.
 *
 * Body: { azureTenantId, clientId, clientSecret }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      azureTenantId?: string;
      clientId?: string;
      clientSecret?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { azureTenantId, clientId, clientSecret } = body;
    if (!azureTenantId || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: "azureTenantId, clientId, and clientSecret are all required" },
        { status: 400 }
      );
    }

    // Validate format — Azure tenant ID and client ID should be GUIDs
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidRegex.test(azureTenantId.trim())) {
      return NextResponse.json(
        { error: "Azure Tenant ID must be a valid GUID (e.g. 12345678-abcd-1234-abcd-123456789abc)" },
        { status: 400 }
      );
    }
    if (!guidRegex.test(clientId.trim())) {
      return NextResponse.json(
        { error: "Application (Client) ID must be a valid GUID" },
        { status: 400 }
      );
    }
    if (clientSecret.trim().length < 8 || clientSecret.trim().length > 500) {
      return NextResponse.json(
        { error: "Client secret must be between 8 and 500 characters" },
        { status: 400 }
      );
    }

    await upsertGraphCredentials({
      tenantId: userId,
      azureTenantId: azureTenantId.trim(),
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
    });

    return NextResponse.json({ message: "Credentials saved" }, { status: 200 });
  } catch (error) {
    console.error("Error saving Graph credentials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/graph/credentials
 * Test the stored credentials by requesting an access token from Azure AD.
 */
export async function PUT() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getGraphAccessToken(userId);
    // Return just a success indicator, never the token itself to the client
    return NextResponse.json({
      success: true,
      tokenLength: token.length,
      message: "Successfully obtained access token from Azure AD",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to obtain token";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/**
 * DELETE /api/graph/credentials
 * Remove stored Azure AD credentials.
 */
export async function DELETE() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteGraphCredentials(userId);
    return NextResponse.json({ message: "Credentials removed" });
  } catch (error) {
    console.error("Error removing Graph credentials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
