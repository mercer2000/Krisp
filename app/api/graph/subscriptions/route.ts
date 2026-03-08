import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import {
  createGraphSubscription,
  getActiveSubscriptions,
  deactivateSubscription,
} from "@/lib/graph/subscriptions";
import {
  getGraphCredentialsById,
  getGraphAccessTokenFromCreds,
} from "@/lib/graph/credentials";

const GRAPH_SUBSCRIPTIONS_URL =
  "https://graph.microsoft.com/v1.0/subscriptions";

/**
 * GET /api/graph/subscriptions
 * List all active Graph subscriptions for the current user.
 */
export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await getActiveSubscriptions(userId);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Error fetching Graph subscriptions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/graph/subscriptions
 * Create a new Graph subscription by proxying to Microsoft Graph API,
 * then storing the result in our database.
 *
 * Body: { credentialId, mailbox, changeType?, clientState? }
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      credentialId?: string;
      mailbox?: string;
      changeType?: string;
      clientState?: string;
    };
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const credentialId = body.credentialId?.trim();
    if (!credentialId) {
      return NextResponse.json(
        { error: "credentialId is required" },
        { status: 400 }
      );
    }

    const mailbox = body.mailbox?.trim();
    if (!mailbox) {
      return NextResponse.json(
        { error: "Mailbox email is required" },
        { status: 400 }
      );
    }

    // Get the credential and obtain an access token
    const creds = await getGraphCredentialsById(credentialId, userId);
    if (!creds) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      );
    }

    let accessToken: string;
    try {
      accessToken = await getGraphAccessTokenFromCreds(creds);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to obtain access token";
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    const resource = `users/${mailbox}/mailFolders/inbox/messages`;
    const changeType = body.changeType || "created";
    const clientState =
      body.clientState || crypto.randomUUID().replace(/-/g, "");

    // Build the notification URL from the request origin
    const origin = request.nextUrl.origin;
    const notificationUrl = `${origin}/api/webhooks/email/graph/${userId}`;

    // Max expiration for mail resources is ~3 days (4230 minutes)
    const expirationDateTime = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000 - 60000
    ).toISOString();

    const subscriptionPayload = {
      changeType,
      notificationUrl,
      resource,
      expirationDateTime,
      clientState,
    };

    // Create subscription on Microsoft Graph
    const graphResponse = await fetch(GRAPH_SUBSCRIPTIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(subscriptionPayload),
    });

    if (!graphResponse.ok) {
      const errorBody = await graphResponse.text();
      let errorDetail: string;
      try {
        const parsed = JSON.parse(errorBody);
        errorDetail =
          parsed?.error?.message || parsed?.error_description || errorBody;
      } catch {
        errorDetail = errorBody;
      }
      return NextResponse.json(
        {
          error: "Microsoft Graph API error",
          status: graphResponse.status,
          detail: errorDetail,
        },
        { status: graphResponse.status >= 400 ? graphResponse.status : 502 }
      );
    }

    const graphResult = await graphResponse.json();

    // Store in our database
    const subscription = await createGraphSubscription({
      tenantId: userId,
      credentialId,
      subscriptionId: graphResult.id,
      resource: graphResult.resource,
      changeType: graphResult.changeType,
      clientState,
      expirationDateTime: new Date(graphResult.expirationDateTime),
      notificationUrl,
    });

    return NextResponse.json(
      {
        message: "Subscription created",
        subscription: {
          id: subscription.id,
          subscriptionId: graphResult.id,
          resource: graphResult.resource,
          changeType: graphResult.changeType,
          expirationDateTime: graphResult.expirationDateTime,
          notificationUrl,
          credentialId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating Graph subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/graph/subscriptions
 * Delete a Graph subscription by ID.
 * Automatically obtains an access token to delete from Graph.
 *
 * Body: { subscriptionId }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { subscriptionId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { subscriptionId } = body;
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 }
      );
    }

    // Look up the subscription to find its credentialId
    const subscriptions = await getActiveSubscriptions(userId);
    const sub = subscriptions.find((s) => s.subscriptionId === subscriptionId);

    // Try to delete from Microsoft Graph using the linked credential
    if (sub?.credentialId) {
      try {
        const creds = await getGraphCredentialsById(sub.credentialId, userId);
        if (creds) {
          const accessToken = await getGraphAccessTokenFromCreds(creds);
          const graphResponse = await fetch(
            `${GRAPH_SUBSCRIPTIONS_URL}/${subscriptionId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!graphResponse.ok && graphResponse.status !== 404) {
            const errorBody = await graphResponse.text();
            console.warn(
              `[Graph] Failed to delete subscription ${subscriptionId} from Graph:`,
              errorBody
            );
          }
        }
      } catch (error) {
        console.warn(
          `[Graph] Could not obtain token to delete subscription from Graph:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    // Deactivate in our database
    await deactivateSubscription(subscriptionId);

    return NextResponse.json({ message: "Subscription deleted" });
  } catch (error) {
    console.error("Error deleting Graph subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
