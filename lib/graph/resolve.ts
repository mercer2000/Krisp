import { db } from "@/lib/db";
import { graphSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getGraphCredentialsByIdUnsafe,
  getGraphAccessTokenFromCreds,
} from "@/lib/graph/credentials";
import { extractUserFromResource } from "@/lib/graph/messages";

export interface GraphSendContext {
  token: string;
  mailbox: string;
}

/**
 * Resolve the Graph API credentials and mailbox for sending emails.
 * Finds the first active graph subscription for the user and returns
 * an access token + mailbox address.
 *
 * Returns null with an error message if credentials can't be resolved.
 */
export async function resolveGraphSendContext(
  userId: string
): Promise<{ context: GraphSendContext } | { error: string; status: number }> {
  const [subscription] = await db
    .select()
    .from(graphSubscriptions)
    .where(
      and(
        eq(graphSubscriptions.tenantId, userId),
        eq(graphSubscriptions.active, true)
      )
    );

  if (!subscription?.credentialId) {
    return {
      error: "No active email integration found. Please connect an email account to send messages.",
      status: 502,
    };
  }

  const creds = await getGraphCredentialsByIdUnsafe(subscription.credentialId);
  if (!creds) {
    return {
      error: "Email integration credentials are missing. Please reconnect your email account.",
      status: 502,
    };
  }

  const token = await getGraphAccessTokenFromCreds(creds);
  const mailbox = extractUserFromResource(subscription.resource);
  if (!mailbox) {
    return {
      error: "Unable to determine sending mailbox. Please reconnect your email account.",
      status: 502,
    };
  }

  return { context: { token, mailbox } };
}
