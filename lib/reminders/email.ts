import { getResend, getSenderEmail } from "@/lib/email/resend";

/**
 * Spaced repetition intervals (in days).
 * Follows SM-2 style spacing: 1, 3, 7, 14, 30, 60 days.
 */
export const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30, 60];

export function getNextSpacedInterval(repetitionNumber: number): number | null {
  if (repetitionNumber >= SPACED_REPETITION_INTERVALS.length) return null;
  return SPACED_REPETITION_INTERVALS[repetitionNumber];
}

function buildReminderEmailHtml(params: {
  thoughtContent: string;
  thoughtTopic: string | null;
  thoughtSource: string;
  note: string | null;
  mode: string;
  repetitionNumber: number;
  appUrl: string;
  thoughtId: string;
}): string {
  const {
    thoughtContent,
    thoughtTopic,
    thoughtSource,
    note,
    mode,
    repetitionNumber,
    appUrl,
    thoughtId,
  } = params;

  const title = thoughtContent.split("\n")[0]?.slice(0, 120) || "Untitled";
  const preview = thoughtContent.split("\n").slice(1).join("\n").trim().slice(0, 500);

  const sourceLabel =
    thoughtSource === "web_clip"
      ? "Web Clip"
      : thoughtSource === "zapier"
        ? "Zapier"
        : "Manual";

  const modeLabel =
    mode === "spaced_repetition"
      ? `Spaced Repetition (Review #${repetitionNumber + 1})`
      : "Scheduled Reminder";

  const thoughtUrl = `${appUrl}/brain?tab=knowledge`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#14b8a6,#6366f1);padding:24px 32px;color:#fff;">
        <h1 style="margin:0;font-size:20px;">Thought Reminder</h1>
        <p style="margin:6px 0 0;opacity:0.9;font-size:13px;">${modeLabel}</p>
      </div>

      <!-- Thought Content -->
      <div style="padding:24px 32px;">
        ${note ? `<div style="background:#fef3c7;border-left:3px solid #f59e0b;padding:12px 16px;margin-bottom:16px;border-radius:0 8px 8px 0;"><p style="margin:0;font-size:13px;color:#92400e;"><strong>Your note:</strong> ${escapeHtml(note)}</p></div>` : ""}

        <div style="margin-bottom:12px;">
          <span style="display:inline-block;background:#e0f2fe;color:#0369a1;font-size:11px;font-weight:600;padding:3px 8px;border-radius:12px;">${sourceLabel}</span>
          ${thoughtTopic ? `<span style="display:inline-block;margin-left:8px;color:#6b7280;font-size:12px;">${escapeHtml(thoughtTopic)}</span>` : ""}
        </div>

        <h2 style="margin:0 0 8px;font-size:16px;color:#1f2937;">${escapeHtml(title)}</h2>

        ${preview ? `<div style="background:#f9fafb;border-radius:8px;padding:16px;margin-top:12px;"><p style="margin:0;font-size:14px;line-height:1.6;color:#374151;white-space:pre-wrap;">${escapeHtml(preview)}</p></div>` : ""}
      </div>

      <!-- CTA -->
      <div style="padding:0 32px 24px;text-align:center;">
        <a href="${thoughtUrl}" style="display:inline-block;background:linear-gradient(135deg,#14b8a6,#6366f1);color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
          Open in Brain
        </a>
      </div>
    </div>

    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">
      Sent by Krisp Thought Reminders
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendReminderEmail(params: {
  userEmail: string;
  thoughtContent: string;
  thoughtTopic: string | null;
  thoughtSource: string;
  thoughtId: string;
  note: string | null;
  mode: string;
  repetitionNumber: number;
}): Promise<void> {
  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://app.krisp.dev";

  const title = params.thoughtContent.split("\n")[0]?.slice(0, 60) || "Thought";

  const html = buildReminderEmailHtml({
    ...params,
    appUrl,
  });

  const resend = getResend();
  await resend.emails.send({
    from: getSenderEmail(),
    to: params.userEmail,
    subject: `Reminder: ${title}`,
    html,
  });
}
