import { getResend, getSenderEmail } from "./resend";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    const senderEmail = getSenderEmail();

    const { error } = await resend.emails.send({
      from: `Life Kanban <${senderEmail}>`,
      to,
      subject: "Reset your password",
      html: buildResetEmailHtml(resetUrl),
    });

    if (error) {
      console.error("Resend API error:", error);
      return { success: false, error: "Failed to send reset email. Please try again later." };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: "Failed to send reset email. Please try again later." };
  }
}

function buildResetEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: system-ui, -apple-system, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 0;">
              <h1 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #0f172a;">
                Reset your password
              </h1>
              <p style="margin: 0 0 24px; font-size: 14px; color: #64748b; line-height: 1.5;">
                We received a request to reset the password for your Life Kanban account. Click the button below to choose a new password.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 32px;">
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">
                Reset Password
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 0;">
              <p style="margin: 0 0 16px; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.5; word-break: break-all;">
                ${resetUrl}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 32px;">
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0 0 16px;">
              <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
                Life Kanban
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
