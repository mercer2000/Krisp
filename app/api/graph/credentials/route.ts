import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import {
  createGraphCredentials,
  getAllGraphCredentials,
  getGraphCredentialsById,
  deleteGraphCredentials,
  getGraphAccessTokenFromCreds,
} from "@/lib/graph/credentials";

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/graph/credentials
 * List all Azure AD credentials for the current user.
 * Returns masked secrets — never the full client secret.
 */
export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const credentials = await getAllGraphCredentials(userId);

    return NextResponse.json({
      credentials: credentials.map((c) => ({
        id: c.id,
        label: c.label,
        azureTenantId: c.azureTenantId,
        clientId: c.clientId,
        clientSecretHint:
          c.clientSecret.length > 8
            ? c.clientSecret.slice(0, 4) + "..." + c.clientSecret.slice(-4)
            : "****",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
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
 * Create a new set of Azure AD app credentials.
 *
 * Body: { label, azureTenantId, clientId, clientSecret }
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      label?: string;
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
    const label = body.label?.trim() || "Default";

    if (!azureTenantId || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: "azureTenantId, clientId, and clientSecret are all required" },
        { status: 400 }
      );
    }

    if (!GUID_REGEX.test(azureTenantId.trim())) {
      return NextResponse.json(
        { error: "Azure Tenant ID must be a valid GUID (e.g. 12345678-abcd-1234-abcd-123456789abc)" },
        { status: 400 }
      );
    }
    if (!GUID_REGEX.test(clientId.trim())) {
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

    const result = await createGraphCredentials({
      tenantId: userId,
      label,
      azureTenantId: azureTenantId.trim(),
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
    });

    return NextResponse.json(
      {
        message: "Credentials saved",
        credential: {
          id: result.id,
          label: result.label,
          azureTenantId: result.azureTenantId,
          clientId: result.clientId,
        },
      },
      { status: 201 }
    );
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
 * Test a specific credential by requesting an access token from Azure AD.
 *
 * Body: { credentialId }
 */
export async function PUT(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { credentialId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    if (!body.credentialId) {
      return NextResponse.json(
        { error: "credentialId is required" },
        { status: 400 }
      );
    }

    const creds = await getGraphCredentialsById(body.credentialId, userId);
    if (!creds) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      );
    }

    const token = await getGraphAccessTokenFromCreds(creds);
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
 * Remove a specific set of Azure AD credentials.
 *
 * Body: { credentialId }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { credentialId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    if (!body.credentialId) {
      return NextResponse.json(
        { error: "credentialId is required" },
        { status: 400 }
      );
    }

    await deleteGraphCredentials(body.credentialId, userId);
    return NextResponse.json({ message: "Credentials removed" });
  } catch (error) {
    console.error("Error removing Graph credentials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
