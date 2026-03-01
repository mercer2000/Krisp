import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        "RESEND_API_KEY environment variable is required. Get your API key from https://resend.com"
      );
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export function getSenderEmail(): string {
  if (!process.env.RESEND_EMAIL) {
    throw new Error(
      "RESEND_EMAIL environment variable is required. Set it to your verified sender email address."
    );
  }
  return process.env.RESEND_EMAIL;
}
