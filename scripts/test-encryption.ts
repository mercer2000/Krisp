/**
 * Integration tests for the encryption layer.
 *
 * Run with:
 *   ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") npx tsx scripts/test-encryption.ts
 *
 * Tests:
 * 1. Core encrypt/decrypt round-trip
 * 2. isEncrypted prefix detection
 * 3. encryptNullable/decryptNullable handle nulls
 * 4. encryptFields/decryptFields on Drizzle-style objects
 * 5. decryptRows batch decryption
 * 6. Unique IVs — no two encryptions produce the same ciphertext
 * 7. Wrong key fails with an error
 * 8. Backward compatibility — plaintext passes through decryptFields unchanged
 */

import assert from "node:assert/strict";
import { encrypt, decrypt, encryptNullable, decryptNullable, isEncrypted, _resetKeyCache } from "../lib/encryption";
import {
  encryptFields,
  decryptFields,
  decryptRows,
  CARD_ENCRYPTED_FIELDS,
  ACTION_ITEM_ENCRYPTED_FIELDS,
} from "../lib/db/encryption-helpers";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(`    ${err instanceof Error ? err.message : err}`);
    failed++;
  }
}

console.log("Encryption integration tests\n");

// ── 1. Round-trip ──────────────────────────────────────
test("encrypt/decrypt round-trip", () => {
  const plaintext = "Hello, world! This is sensitive data. 🔐";
  const ciphertext = encrypt(plaintext);
  assert.ok(ciphertext.startsWith("enc:v1:"), "Ciphertext should have enc:v1: prefix");
  assert.notEqual(ciphertext, plaintext, "Ciphertext should differ from plaintext");
  const decrypted = decrypt(ciphertext);
  assert.equal(decrypted, plaintext, "Decrypted should match original");
});

// ── 2. isEncrypted ─────────────────────────────────────
test("isEncrypted detection", () => {
  assert.equal(isEncrypted("enc:v1:abc123"), true);
  assert.equal(isEncrypted("hello world"), false);
  assert.equal(isEncrypted(""), false);
  assert.equal(isEncrypted("enc:v2:something"), false); // wrong version
});

// ── 3. Nullable helpers ────────────────────────────────
test("encryptNullable/decryptNullable handle null", () => {
  assert.equal(encryptNullable(null), null);
  assert.equal(decryptNullable(null), null);

  const enc = encryptNullable("test value");
  assert.ok(enc !== null && isEncrypted(enc));
  assert.equal(decryptNullable(enc!), "test value");
});

// ── 4. encryptFields/decryptFields ─────────────────────
test("encryptFields encrypts only specified fields", () => {
  const obj = {
    title: "My Card",
    description: "Some description",
    position: 1024,
    priority: "high",
  };

  const encrypted = encryptFields(obj, CARD_ENCRYPTED_FIELDS);

  // Encrypted fields
  assert.ok(isEncrypted(encrypted.title as string), "title should be encrypted");
  assert.ok(isEncrypted(encrypted.description as string), "description should be encrypted");

  // Non-encrypted fields unchanged
  assert.equal(encrypted.position, 1024);
  assert.equal(encrypted.priority, "high");
});

test("decryptFields decrypts encrypted fields", () => {
  const obj = {
    title: "My Card",
    description: "Some description",
    position: 1024,
  };

  const encrypted = encryptFields(obj, CARD_ENCRYPTED_FIELDS);
  const decrypted = decryptFields(encrypted, CARD_ENCRYPTED_FIELDS);

  assert.equal(decrypted.title, "My Card");
  assert.equal(decrypted.description, "Some description");
  assert.equal(decrypted.position, 1024);
});

test("encryptFields skips null values", () => {
  const obj = {
    title: "My Card",
    description: null as string | null,
  };

  const encrypted = encryptFields(obj, CARD_ENCRYPTED_FIELDS);
  assert.ok(isEncrypted(encrypted.title as string));
  assert.equal(encrypted.description, null);
});

test("encryptFields skips already-encrypted values", () => {
  const obj = {
    title: encrypt("Already encrypted"),
    description: "Not encrypted yet",
  };

  const encrypted = encryptFields(obj, CARD_ENCRYPTED_FIELDS);
  // title should remain the same ciphertext (not double-encrypted)
  assert.equal(encrypted.title, obj.title);
  // description should now be encrypted
  assert.ok(isEncrypted(encrypted.description as string));
});

// ── 5. decryptRows ─────────────────────────────────────
test("decryptRows batch decryption", () => {
  const rows = [
    { title: encrypt("Card 1"), description: encrypt("Desc 1"), priority: "low" },
    { title: encrypt("Card 2"), description: null, priority: "high" },
  ];

  const decrypted = decryptRows(rows, [...CARD_ENCRYPTED_FIELDS]);

  assert.equal(decrypted[0].title, "Card 1");
  assert.equal(decrypted[0].description, "Desc 1");
  assert.equal(decrypted[0].priority, "low");
  assert.equal(decrypted[1].title, "Card 2");
  assert.equal(decrypted[1].description, null);
});

// ── 6. Unique IVs ──────────────────────────────────────
test("unique IVs — same plaintext produces different ciphertexts", () => {
  const plaintext = "identical text";
  const a = encrypt(plaintext);
  const b = encrypt(plaintext);
  assert.notEqual(a, b, "Two encryptions of the same plaintext should differ");
  assert.equal(decrypt(a), plaintext);
  assert.equal(decrypt(b), plaintext);
});

// ── 7. Wrong key detection ─────────────────────────────
test("wrong key fails with error", () => {
  const ciphertext = encrypt("secret");

  // Temporarily swap the key
  const originalKey = process.env.ENCRYPTION_KEY;
  const crypto = require("crypto");
  process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
  _resetKeyCache();

  assert.throws(
    () => decrypt(ciphertext),
    (err: Error) => err.message.includes("decrypt") || err.message.includes("auth") || err.message.includes("Unsupported"),
    "Decryption with wrong key should throw"
  );

  // Restore
  process.env.ENCRYPTION_KEY = originalKey;
  _resetKeyCache();
});

// ── 8. Backward compatibility ──────────────────────────
test("plaintext passes through decryptFields unchanged", () => {
  const obj = {
    title: "Plaintext Title",
    description: "Plaintext Description",
    assignee: "John",
  };

  const result = decryptFields(obj, [...ACTION_ITEM_ENCRYPTED_FIELDS]);

  assert.equal(result.title, "Plaintext Title");
  assert.equal(result.description, "Plaintext Description");
  assert.equal(result.assignee, "John");
});

// ── Summary ────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
