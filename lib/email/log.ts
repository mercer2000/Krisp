import { db } from "@/lib/db";
import { emailLogs } from "@/lib/db/schema";
import { getResend, getSenderEmail } from "./resend";

interface LogAndSendParams {
  from?: string;
  to: string;
  subject: string;
  html: string;
  userId?: string | null;
  type: string;
  originalEmailLogId?: string;
}

export async function logAndSend(params: LogAndSendParams) {
  const resend = getResend();
  const from = params.from ?? getSenderEmail();

  // Send the email first — delivery is never blocked by logging
  const result = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (result.error) {
    console.error("[email-log] Resend API error:", result.error);
  }

  // Best-effort logging
  try {
    await db.insert(emailLogs).values({
      userId: params.userId ?? null,
      recipientEmail: params.to,
      fromEmail: from,
      type: params.type,
      subject: params.subject,
      htmlBody: params.html,
      resendId: result.data?.id ?? null,
      status: result.error ? "failed" : "sent",
      originalEmailLogId: params.originalEmailLogId ?? null,
    });
  } catch (error) {
    console.error("[email-log] Failed to log email:", error);
  }

  return result;
}
