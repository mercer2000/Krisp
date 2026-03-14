import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { emailLogs, emailEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const STATUS_PRIORITY: Record<string, number> = {
  sent: 1,
  delivered: 2,
  opened: 3,
  bounced: 4,
  complained: 5,
};

function eventTypeToStatus(eventType: string): string | null {
  const map: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.opened": "opened",
    "email.bounced": "bounced",
    "email.complained": "complained",
  };
  return map[eventType] ?? null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let payload: { type: string; data: { email_id?: string; created_at?: string; [key: string]: unknown } };
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof payload;
  } catch (err) {
    console.error("[resend-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const resendId = payload.data.email_id;
  if (!resendId) {
    return NextResponse.json({ received: true });
  }

  // Look up the email log
  const [log] = await db
    .select({ id: emailLogs.id, status: emailLogs.status })
    .from(emailLogs)
    .where(eq(emailLogs.resendId, resendId))
    .limit(1);

  if (!log) {
    // Email sent before logging was added — skip
    return NextResponse.json({ received: true });
  }

  // Insert event
  await db.insert(emailEvents).values({
    emailLogId: log.id,
    eventType: payload.type,
    metadata: payload.data,
    occurredAt: payload.data.created_at
      ? new Date(payload.data.created_at)
      : new Date(),
  });

  // Update denormalized status if higher priority
  const newStatus = eventTypeToStatus(payload.type);
  if (newStatus) {
    const currentPriority = STATUS_PRIORITY[log.status] ?? 0;
    const newPriority = STATUS_PRIORITY[newStatus] ?? 0;
    if (newPriority > currentPriority) {
      await db
        .update(emailLogs)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(emailLogs.id, log.id));
    }
  }

  return NextResponse.json({ received: true });
}
