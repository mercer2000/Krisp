import { NextRequest, NextResponse } from "next/server";
import {
  getExpiringSubscriptions,
  renewSubscription,
  deactivateSubscription,
} from "@/lib/graph/subscriptions";
import {
  getGraphCredentialsByIdUnsafe,
  getGraphAccessTokenFromCreds,
} from "@/lib/graph/credentials";
import {
  getValidOutlookAccessToken,
  deactivateOutlookToken,
} from "@/lib/outlook/oauth";

/**
 * GET /api/cron/graph-subscription-renewal
 * Renew Graph subscriptions expiring within 2 hours.
 * Schedule: every hour (0 * * * *)
 */
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    cronSecret !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const expiring = await getExpiringSubscriptions(twoHoursFromNow);

  let renewed = 0;
  let failed = 0;

  for (const sub of expiring) {
    try {
      let accessToken: string;

      if (sub.credentialId) {
        const creds = await getGraphCredentialsByIdUnsafe(sub.credentialId);
        if (!creds) {
          console.warn(`[Renewal] Credential ${sub.credentialId} not found, deactivating subscription`);
          await deactivateSubscription(sub.subscriptionId);
          failed++;
          continue;
        }
        accessToken = await getGraphAccessTokenFromCreds(creds);
      } else if (sub.outlookOauthTokenId) {
        accessToken = await getValidOutlookAccessToken(
          sub.outlookOauthTokenId,
          sub.tenantId
        );
      } else {
        console.warn(`[Renewal] Subscription ${sub.subscriptionId} has no credential or token, deactivating`);
        await deactivateSubscription(sub.subscriptionId);
        failed++;
        continue;
      }

      const newExpiration = new Date(Date.now() + 4230 * 60 * 1000);
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/subscriptions/${sub.subscriptionId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expirationDateTime: newExpiration.toISOString(),
          }),
        }
      );

      if (res.ok) {
        await renewSubscription(sub.subscriptionId, newExpiration);
        renewed++;
      } else {
        const errText = await res.text().catch(() => "");
        console.error(
          `[Renewal] Failed to renew ${sub.subscriptionId} (${res.status}): ${errText}`
        );
        await deactivateSubscription(sub.subscriptionId);

        if (sub.outlookOauthTokenId) {
          await deactivateOutlookToken(sub.outlookOauthTokenId, sub.tenantId);
        }

        failed++;
      }
    } catch (err) {
      console.error(
        `[Renewal] Error processing subscription ${sub.subscriptionId}:`,
        err instanceof Error ? err.message : err
      );
      await deactivateSubscription(sub.subscriptionId);

      if (sub.outlookOauthTokenId) {
        try {
          await deactivateOutlookToken(sub.outlookOauthTokenId, sub.tenantId);
        } catch {
          // Non-fatal
        }
      }

      failed++;
    }
  }

  return NextResponse.json({
    message: "Subscription renewal complete",
    total: expiring.length,
    renewed,
    failed,
  });
}
