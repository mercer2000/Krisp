"use server";

import { db } from "@/lib/db";
import { emailLogs, adminActionLogs, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { logAndSend } from "@/lib/email/log";

async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.role !== "admin") throw new Error("Forbidden");
  return session.user.id;
}

export async function resendEmail(emailLogId: string) {
  const adminUserId = await requireAdmin();

  const [original] = await db
    .select({
      recipientEmail: emailLogs.recipientEmail,
      fromEmail: emailLogs.fromEmail,
      subject: emailLogs.subject,
      htmlBody: emailLogs.htmlBody,
      userId: emailLogs.userId,
      type: emailLogs.type,
    })
    .from(emailLogs)
    .where(eq(emailLogs.id, emailLogId))
    .limit(1);

  if (!original) return { error: "Email not found" };

  try {
    await logAndSend({
      from: original.fromEmail,
      to: original.recipientEmail,
      subject: original.subject,
      html: original.htmlBody,
      userId: original.userId,
      type: original.type,
      originalEmailLogId: emailLogId,
    });

    await db.insert(adminActionLogs).values({
      adminUserId,
      action: "resend_email",
      details: { originalEmailLogId: emailLogId },
    });

    return { success: true };
  } catch (err) {
    console.error("[admin] Failed to resend email:", err);
    return { error: "Failed to resend email" };
  }
}
