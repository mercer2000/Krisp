import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Application-layer encryption module using AES-256-GCM.
 *
 * Every encrypted value is stored as a self-contained string:
 *   enc:v1:<base64(iv + authTag + ciphertext)>
 *
 * - IV:       12 bytes (96 bits, GCM recommended)
 * - Auth tag: 16 bytes (128 bits)
 * - The rest:  ciphertext
 *
 * The `enc:v1:` prefix allows the migration script to detect
 * already-encrypted rows (idempotency) and supports future
 * key versioning for rotation.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTED_PREFIX = "enc:v1:";

let _keyBuffer: Buffer | null = null;

/**
 * Lazily resolve and cache the 32-byte encryption key from the
 * ENCRYPTION_KEY environment variable (hex-encoded, 64 chars).
 */
function getKey(): Buffer {
  if (_keyBuffer) return _keyBuffer;

  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. " +
        "Provide a 64-character hex string (32 bytes)."
    );
  }

  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly 32 bytes (64 hex chars). Got ${buf.length} bytes.`
    );
  }

  _keyBuffer = buf;
  return _keyBuffer;
}

/**
 * Encrypt a plaintext string.
 * Returns `enc:v1:<base64(iv + tag + ciphertext)>`.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack: iv (12) + authTag (16) + ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted]);
  return ENCRYPTED_PREFIX + packed.toString("base64");
}

/**
 * Decrypt a ciphertext string produced by `encrypt()`.
 * Throws on invalid/tampered data or wrong key.
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext.startsWith(ENCRYPTED_PREFIX)) {
    throw new Error("Invalid encrypted value: missing prefix");
  }

  const key = getKey();
  const packed = Buffer.from(
    ciphertext.slice(ENCRYPTED_PREFIX.length),
    "base64"
  );

  if (packed.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted value: too short");
  }

  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Encrypt a nullable value. `null` stays `null`.
 */
export function encryptNullable(value: string | null): string | null {
  if (value === null) return null;
  return encrypt(value);
}

/**
 * Decrypt a nullable value. `null` stays `null`.
 */
export function decryptNullable(value: string | null): string | null {
  if (value === null) return null;
  return decrypt(value);
}

/**
 * Check whether a string is already encrypted (has the `enc:v1:` prefix).
 * Used by the migration script for idempotency.
 */
export function isEncrypted(value: string | null): boolean {
  if (value === null) return false;
  return value.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Reset the cached key buffer (useful for tests).
 * @internal
 */
export function _resetKeyCache(): void {
  _keyBuffer = null;
}
