import { logAndSend } from "@/lib/email/log";

const FROM = "MyOpenBrain <noreply@myopenbrain.com>";

export async function sendSubscriptionConfirmedEmail(
  to: string,
  planName: string,
  features: string[],
  nextBillingDate: Date
) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[billing-emails] RESEND_API_KEY not set, skipping email");
    return;
  }
  const subject = `Welcome to MyOpenBrain ${planName}!`;
  const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Your ${planName} plan is active</h2>
        <p style="color: #475569;">Thanks for upgrading! Here's what you've unlocked:</p>
        <ul style="color: #334155;">
          ${features.map((f) => `<li>${f}</li>`).join("")}
        </ul>
        <p style="color: #475569;">
          Next billing date: <strong>${nextBillingDate.toLocaleDateString()}</strong>
        </p>
        <p style="color: #475569;">
          Manage your subscription anytime from
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" style="color: #2563eb;">Billing Settings</a>.
        </p>
      </div>
    `;
  try {
    await logAndSend({ from: FROM, to, subject, html, userId: undefined, type: "billing.subscription_confirmed" });
  } catch (err) {
    console.error("[billing-emails] Failed to send email:", err);
  }
}

export async function sendPlanDowngradedEmail(
  to: string,
  previousPlan: string,
  newPlan: string,
  lostFeatures: string[]
) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[billing-emails] RESEND_API_KEY not set, skipping email");
    return;
  }
  const subject = `Your MyOpenBrain plan has changed to ${newPlan}`;
  const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Plan changed: ${previousPlan} → ${newPlan}</h2>
        <p style="color: #475569;">Your plan has been downgraded. The following features are no longer available:</p>
        <ul style="color: #334155;">
          ${lostFeatures.map((f) => `<li>${f}</li>`).join("")}
        </ul>
        <p style="color: #475569;">Your existing data remains accessible in read-only mode.</p>
        <p style="color: #475569;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" style="color: #2563eb;">Reactivate your plan</a>
        </p>
      </div>
    `;
  try {
    await logAndSend({ from: FROM, to, subject, html, userId: undefined, type: "billing.plan_downgraded" });
  } catch (err) {
    console.error("[billing-emails] Failed to send email:", err);
  }
}

export async function sendPaymentFailedEmail(
  to: string,
  amountDue: number,
  portalUrl?: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[billing-emails] RESEND_API_KEY not set, skipping email");
    return;
  }
  const amount = (amountDue / 100).toFixed(2);
  const subject = "Payment failed — action required";
  const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Payment failed</h2>
        <p style="color: #475569;">
          We were unable to process your payment of <strong>$${amount}</strong>.
          Your subscription is now past due.
        </p>
        <p style="color: #475569;">
          Please update your payment method to avoid losing access:
        </p>
        <p>
          <a href="${portalUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/billing`}"
             style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
            Update payment method
          </a>
        </p>
      </div>
    `;
  try {
    await logAndSend({ from: FROM, to, subject, html, userId: undefined, type: "billing.payment_failed" });
  } catch (err) {
    console.error("[billing-emails] Failed to send email:", err);
  }
}

export async function sendSubscriptionCanceledEmail(
  to: string,
  effectiveDate: Date
) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[billing-emails] RESEND_API_KEY not set, skipping email");
    return;
  }
  const subject = "Your MyOpenBrain subscription has been canceled";
  const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Subscription canceled</h2>
        <p style="color: #475569;">
          Your subscription will end on <strong>${effectiveDate.toLocaleDateString()}</strong>.
          You'll retain access to premium features until then.
        </p>
        <p style="color: #475569;">
          Your data will remain accessible on the Free plan in read-only mode.
        </p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing"
             style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
            Reactivate subscription
          </a>
        </p>
      </div>
    `;
  try {
    await logAndSend({ from: FROM, to, subject, html, userId: undefined, type: "billing.subscription_canceled" });
  } catch (err) {
    console.error("[billing-emails] Failed to send email:", err);
  }
}

export async function sendTrialEndingSoonEmail(
  to: string,
  daysRemaining: number
) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[billing-emails] RESEND_API_KEY not set, skipping email");
    return;
  }
  const subject = `Your MyOpenBrain trial ends in ${daysRemaining} days`;
  const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Trial ending soon</h2>
        <p style="color: #475569;">
          Your free trial ends in <strong>${daysRemaining} days</strong>.
          Upgrade now to keep all your premium features.
        </p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing"
             style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
            Choose a plan
          </a>
        </p>
      </div>
    `;
  try {
    await logAndSend({ from: FROM, to, subject, html, userId: undefined, type: "billing.trial_ending_soon" });
  } catch (err) {
    console.error("[billing-emails] Failed to send email:", err);
  }
}

export async function sendPlanChangedEmail(
  to: string,
  previousPlanName: string,
  newPlanName: string,
  newFeatures: string[],
  monthlyAmount: number
) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[billing-emails] RESEND_API_KEY not set, skipping email");
    return;
  }
  const amount = (monthlyAmount / 100).toFixed(2);
  const subject = `Your MyOpenBrain plan has changed to ${newPlanName}`;
  const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Plan updated: ${previousPlanName} → ${newPlanName}</h2>
        <p style="color: #475569;">
          Your plan has been changed to <strong>${newPlanName}</strong> at <strong>$${amount}/mo</strong>.
          Any price difference will be prorated on your next invoice.
        </p>
        <p style="color: #475569;">Your plan includes:</p>
        <ul style="color: #334155;">
          ${newFeatures.map((f) => `<li>${f}</li>`).join("")}
        </ul>
        <p style="color: #475569;">
          Manage your subscription anytime from
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/billing" style="color: #2563eb;">Billing Settings</a>.
        </p>
      </div>
    `;
  try {
    await logAndSend({ from: FROM, to, subject, html, userId: undefined, type: "billing.plan_changed" });
  } catch (err) {
    console.error("[billing-emails] Failed to send email:", err);
  }
}

export async function sendInvoicePaidEmail(
  to: string,
  amount: number,
  periodStart: Date,
  periodEnd: Date,
  pdfUrl: string | null
) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[billing-emails] RESEND_API_KEY not set, skipping email");
    return;
  }
  const formattedAmount = (amount / 100).toFixed(2);
  const subject = `MyOpenBrain receipt — $${formattedAmount}`;
  const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Payment received</h2>
        <p style="color: #475569;">
          Amount: <strong>$${formattedAmount}</strong><br />
          Period: ${periodStart.toLocaleDateString()} — ${periodEnd.toLocaleDateString()}
        </p>
        ${pdfUrl ? `<p><a href="${pdfUrl}" style="color: #2563eb;">Download PDF invoice</a></p>` : ""}
      </div>
    `;
  try {
    await logAndSend({ from: FROM, to, subject, html, userId: undefined, type: "billing.invoice_paid" });
  } catch (err) {
    console.error("[billing-emails] Failed to send email:", err);
  }
}
