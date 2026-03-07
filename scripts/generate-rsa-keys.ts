/**
 * One-time script to generate RS256 keypair for NextAuth + Neon RLS.
 *
 * Usage:
 *   npx tsx scripts/generate-rsa-keys.ts
 *
 * Copy the output values into your .env.local file.
 */
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

async function main() {
  const { publicKey, privateKey } = await generateKeyPair("RS256", {
    extractable: true,
  });

  const privatePem = await exportPKCS8(privateKey);
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = crypto.randomUUID();
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";

  // Base64-encode the PEM so it fits in a single env var line
  const privateKeyB64 = Buffer.from(privatePem).toString("base64");
  const publicJwkB64 = Buffer.from(JSON.stringify(publicJwk)).toString("base64");

  console.log("\n# Add these to your .env.local:\n");
  console.log(`AUTH_PRIVATE_KEY=${privateKeyB64}`);
  console.log(`AUTH_PUBLIC_JWK=${publicJwkB64}`);
  console.log("\n# Done. Now configure your Neon Console:");
  console.log("# Settings > RLS > Add Provider > JWKS URL:");
  console.log("# https://your-domain.com/.well-known/jwks.json\n");
}

main().catch(console.error);
