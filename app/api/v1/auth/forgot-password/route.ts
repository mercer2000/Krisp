import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { forgotPasswordSchema } from "@/lib/validators/schemas";
import { eq } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email/password-reset";

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Rate limit by normalized email
    if (!checkRateLimit(email.toLowerCase())) {
      // Return generic message to not reveal rate limiting details
      return NextResponse.json({
        message:
          "If an account with that email exists, we've sent a password reset link.",
      });
    }

    // Look up user - always return generic message regardless of whether user exists
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      // Don't reveal that the email doesn't exist
      return NextResponse.json({
        message:
          "If an account with that email exists, we've sent a password reset link.",
      });
    }

    // Invalidate any existing unused tokens for this user by checking expiry
    // (we don't delete them, they just expire naturally or get superseded)

    // Generate cryptographically random token
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    // Store hashed token
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Build reset URL
    const origin =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const resetUrl = `${origin}/reset-password?token=${rawToken}`;

    // Send email
    const result = await sendPasswordResetEmail(user.email, resetUrl);

    if (!result.success) {
      console.error("Failed to send password reset email:", result.error);
      return NextResponse.json(
        { error: "Unable to send reset email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        "If an account with that email exists, we've sent a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
