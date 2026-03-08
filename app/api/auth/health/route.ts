import { NextResponse } from "next/server";
import { importPKCS8, importJWK, SignJWT, jwtVerify } from "jose";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check AUTH_PRIVATE_KEY
  try {
    const raw = process.env.AUTH_PRIVATE_KEY;
    if (!raw) {
      checks.AUTH_PRIVATE_KEY = "MISSING";
    } else {
      const pem = Buffer.from(raw, "base64").toString("utf-8");
      checks.AUTH_PRIVATE_KEY_starts = pem.substring(0, 30) + "...";
      const pk = await importPKCS8(pem, "RS256");
      checks.AUTH_PRIVATE_KEY = pk ? "OK" : "FAILED";
    }
  } catch (err) {
    checks.AUTH_PRIVATE_KEY = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Check AUTH_PUBLIC_JWK
  try {
    const raw = process.env.AUTH_PUBLIC_JWK;
    if (!raw) {
      checks.AUTH_PUBLIC_JWK = "MISSING";
    } else {
      const jwk = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
      checks.AUTH_PUBLIC_JWK_kid = jwk.kid ?? "(no kid)";
      const pub = await importJWK(jwk, "RS256");
      checks.AUTH_PUBLIC_JWK = pub ? "OK" : "FAILED";
    }
  } catch (err) {
    checks.AUTH_PUBLIC_JWK = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Try sign + verify round-trip
  try {
    if (checks.AUTH_PRIVATE_KEY === "OK" && checks.AUTH_PUBLIC_JWK === "OK") {
      const pem = Buffer.from(process.env.AUTH_PRIVATE_KEY!, "base64").toString("utf-8");
      const pk = await importPKCS8(pem, "RS256");
      const jwk = JSON.parse(Buffer.from(process.env.AUTH_PUBLIC_JWK!, "base64").toString("utf-8"));
      const pub = await importJWK(jwk, "RS256");

      const jwt = await new SignJWT({ test: true })
        .setProtectedHeader({ alg: "RS256", kid: jwk.kid })
        .setIssuedAt()
        .setExpirationTime("1m")
        .setSubject("test")
        .sign(pk);

      const { payload } = await jwtVerify(jwt, pub as CryptoKey, { algorithms: ["RS256"] });
      checks.ROUND_TRIP = payload.test === true ? "OK" : "FAILED";
    } else {
      checks.ROUND_TRIP = "SKIPPED (key errors)";
    }
  } catch (err) {
    checks.ROUND_TRIP = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Check AUTH_SECRET
  checks.AUTH_SECRET = process.env.AUTH_SECRET ? "SET" : "MISSING";

  // Check DATABASE_URL
  checks.DATABASE_URL = process.env.DATABASE_URL ? "SET" : "MISSING";

  return NextResponse.json(checks);
}
