/**
 * Next.js instrumentation hook — runs once at server startup.
 * Validates that required encryption environment variables are present.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      console.error(
        "\n[FATAL] ENCRYPTION_KEY environment variable is not set.\n" +
          "Provide a 64-character hex string (32 bytes for AES-256-GCM).\n" +
          "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"\n"
      );
      process.exit(1);
    }

    const buf = Buffer.from(key, "hex");
    if (buf.length !== 32) {
      console.error(
        `\n[FATAL] ENCRYPTION_KEY must be exactly 32 bytes (64 hex chars). Got ${buf.length} bytes.\n`
      );
      process.exit(1);
    }

    console.log("[Startup] ENCRYPTION_KEY validated (32 bytes)");
  }
}
