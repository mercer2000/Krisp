import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  createGraphSubscription,
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
 * Attempt to create a brand-new Graph subscription to replace one that
 * expired or was deleted by Microsoft.  Returns true on success.
 */
async function recreateSubscription(
  sub: { tenantId: string; resource: string; changeType: string; credentialId: string | null; outlookOauthTokenId: string | null; notificationUrl: string | null; subscriptionId: string },
  accessToken: string
): Promise<boolean> {
  const notificationUrl =
    sub.notificationUrl ??
    `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/email/graph/${sub.tenantId}`;

  const clientState = randomUUID();
  const expirationDateTime = new Date(Date.now() + 4230 * 60 * 1000);

  const createRes = await fetch(
    "https://graph.microsoft.com/v1.0/subscriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        changeType: sub.changeType || "created",
        notificationUrl,
        resource: sub.resource,
        expirationDateTime: expirationDateTime.toISOString(),
        clientState,
      }),
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => "");
    console.error(
      `[Renewal] Failed to recreate subscription (${createRes.status}): ${errText}`
    );
    return false;
  }

  const newSub = await createRes.json();

  // Deactivate the old record
  await deactivateSubscription(sub.subscriptionId);

  // Store the new subscription
  await createGraphSubscription({
    tenantId: sub.tenantId,
    credentialId: sub.credentialId,
    outlookOauthTokenId: sub.outlookOauthTokenId,
    subscriptionId: newSub.id,
    resource: sub.resource,
    changeType: sub.changeType || "created",
    clientState,
    expirationDateTime: new Date(newSub.expirationDateTime),
    notificationUrl,
  });

  return true;
}

/**
 * GET /api/cron/graph-subscription-renewal
 * Renew Graph subscriptions expiring within 2 hours.
 * If PATCH renewal fails (e.g. subscription expired/deleted by Microsoft),
 * attempts to recreate the subscription automatically.
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
  let recreated = 0;
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
        console.warn(
          `[Renewal] PATCH failed for ${sub.subscriptionId} (${res.status}): ${errText}`
        );

        // Subscription expired or deleted by Microsoft — try to recreate it
        console.log(`[Renewal] Attempting to recreate subscription for tenant ${sub.tenantId}`);
        const didRecreate = await recreateSubscription(sub, accessToken);

        if (didRecreate) {
          console.log(`[Renewal] Successfully recreated subscription for tenant ${sub.tenantId}`);
          recreated++;
        } else {
          // Leave subscription active so the next cron cycle retries recreation.
          // Don't deactivate the OAuth token — it's still valid.
          failed++;
        }
      }
    } catch (err) {
      console.error(
        `[Renewal] Error processing subscription ${sub.subscriptionId}:`,
        err instanceof Error ? err.message : err
      );
      // Leave subscription active for retry on next cycle
      failed++;
    }
  }

  return NextResponse.json({
    message: "Subscription renewal complete",
    total: expiring.length,
    renewed,
    recreated,
    failed,
  });
}
