/**
 * OpenRouter per-user API key management.
 *
 * Uses the OpenRouter Provisioning API to create, query, and delete
 * API keys for each tenant. The provisioning key (OPENROUTER_PROVISIONING_KEY)
 * is used exclusively for key management — it cannot make completion requests.
 *
 * Flow:
 *   1. On user registration, call `createUserKey(userId, displayName)`
 *   2. Store the returned `key` (encrypted) and `hash` in the users table
 *   3. On AI requests, decrypt the user's key and pass it to the OpenAI client
 *   4. On account deletion, call `deleteUserKey(hash)` to clean up
 */

const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1";

function getProvisioningKey(): string {
  const key = process.env.OPENROUTER_PROVISIONING_KEY;
  if (!key) {
    throw new Error(
      "OPENROUTER_PROVISIONING_KEY is not set. " +
        "Create a provisioning key at https://openrouter.ai/settings/keys"
    );
  }
  return key;
}

export interface CreateKeyResult {
  /** The actual API key — only returned at creation time. */
  key: string;
  /** The key hash for future management (update/delete). */
  hash: string;
}

export interface KeyInfo {
  hash: string;
  name: string;
  label: string;
  disabled: boolean;
  limit: number | null;
  limit_remaining: number | null;
  usage: number;
  created_at: string;
}

/**
 * Create a new OpenRouter API key for a user.
 * The key string is only available in the response — store it encrypted.
 */
export async function createUserKey(
  userId: string,
  displayName: string
): Promise<CreateKeyResult> {
  const provisioningKey = getProvisioningKey();

  const response = await fetch(`${OPENROUTER_API_BASE}/keys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provisioningKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `User: ${displayName} (${userId})`,
      limit: 10,
      limit_reset: "monthly",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenRouter key creation failed (${response.status}): ${body}`
    );
  }

  const data = await response.json();
  return { key: data.data.key, hash: data.data.hash };
}

/**
 * Get info about a user's key by its hash.
 */
export async function getUserKeyInfo(hash: string): Promise<KeyInfo | null> {
  const provisioningKey = getProvisioningKey();

  const response = await fetch(`${OPENROUTER_API_BASE}/keys/${hash}`, {
    headers: {
      Authorization: `Bearer ${provisioningKey}`,
    },
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenRouter key lookup failed (${response.status}): ${body}`
    );
  }

  const data = await response.json();
  return data.data as KeyInfo;
}

/**
 * Delete a user's OpenRouter key by its hash.
 */
export async function deleteUserKey(hash: string): Promise<void> {
  const provisioningKey = getProvisioningKey();

  const response = await fetch(`${OPENROUTER_API_BASE}/keys/${hash}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${provisioningKey}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const body = await response.text();
    throw new Error(
      `OpenRouter key deletion failed (${response.status}): ${body}`
    );
  }
}

/**
 * Update a user's key (e.g. to change limit or disable it).
 */
export async function updateUserKey(
  hash: string,
  updates: { disabled?: boolean; limit?: number; limit_reset?: string; name?: string }
): Promise<void> {
  const provisioningKey = getProvisioningKey();

  const response = await fetch(`${OPENROUTER_API_BASE}/keys/${hash}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${provisioningKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenRouter key update failed (${response.status}): ${body}`
    );
  }
}
