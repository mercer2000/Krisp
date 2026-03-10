const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export interface GraphMailFolder {
  id: string;
  displayName: string;
  parentFolderId: string;
  childFolderCount: number;
  totalItemCount: number;
  unreadItemCount: number;
}

/**
 * Create a mail folder in the authenticated user's mailbox.
 * Uses delegated auth (/me endpoint).
 */
export async function createMailFolder(
  accessToken: string,
  displayName: string
): Promise<GraphMailFolder> {
  const res = await fetch(`${GRAPH_BASE}/me/mailFolders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ displayName }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GraphApiError(
      `Failed to create mail folder "${displayName}": ${res.status}`,
      res.status,
      body
    );
  }

  return res.json();
}

/**
 * Find an existing mail folder by display name.
 * Returns null if not found.
 */
export async function findMailFolderByName(
  accessToken: string,
  displayName: string
): Promise<GraphMailFolder | null> {
  const filter = encodeURIComponent(`displayName eq '${displayName.replace(/'/g, "''")}'`);
  const res = await fetch(
    `${GRAPH_BASE}/me/mailFolders?$filter=${filter}&$top=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GraphApiError(
      `Failed to search mail folders: ${res.status}`,
      res.status,
      body
    );
  }

  const data = await res.json();
  return data.value?.[0] ?? null;
}

/**
 * Get a mail folder by its ID. Returns null if not found (404).
 */
export async function getMailFolderById(
  accessToken: string,
  folderId: string
): Promise<GraphMailFolder | null> {
  const res = await fetch(
    `${GRAPH_BASE}/me/mailFolders/${encodeURIComponent(folderId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (res.status === 404) return null;

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GraphApiError(
      `Failed to get mail folder: ${res.status}`,
      res.status,
      body
    );
  }

  return res.json();
}

/**
 * Rename a mail folder.
 */
export async function renameMailFolder(
  accessToken: string,
  folderId: string,
  newDisplayName: string
): Promise<GraphMailFolder> {
  const res = await fetch(
    `${GRAPH_BASE}/me/mailFolders/${encodeURIComponent(folderId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ displayName: newDisplayName }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GraphApiError(
      `Failed to rename mail folder: ${res.status}`,
      res.status,
      body
    );
  }

  return res.json();
}

/**
 * Move a message to a specific mail folder.
 * Returns the new message ID (Graph may reassign IDs on move).
 */
export async function moveMessageToFolder(
  accessToken: string,
  messageId: string,
  destinationFolderId: string
): Promise<{ id: string; parentFolderId: string }> {
  const res = await fetch(
    `${GRAPH_BASE}/me/messages/${encodeURIComponent(messageId)}/move`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ destinationId: destinationFolderId }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GraphApiError(
      `Failed to move message: ${res.status}`,
      res.status,
      body
    );
  }

  return res.json();
}

/**
 * Get the parent folder ID of a specific message.
 * Used for idempotency check — skip move if already in correct folder.
 */
export async function getMessageParentFolder(
  accessToken: string,
  messageId: string
): Promise<string | null> {
  const res = await fetch(
    `${GRAPH_BASE}/me/messages/${encodeURIComponent(messageId)}?$select=parentFolderId`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (res.status === 404) return null;

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GraphApiError(
      `Failed to get message parent folder: ${res.status}`,
      res.status,
      body
    );
  }

  const data = await res.json();
  return data.parentFolderId ?? null;
}

/**
 * Custom error class for Graph API errors with status code and body.
 */
export class GraphApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody: string
  ) {
    super(message);
    this.name = "GraphApiError";
  }

  /** True if the user revoked OAuth access or token is invalid. */
  get isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  /** True if the mailbox storage quota is exceeded. */
  get isQuotaError(): boolean {
    return this.statusCode === 507;
  }

  /** True if we're being rate-limited. */
  get isRateLimited(): boolean {
    return this.statusCode === 429;
  }

  /** True if the resource was not found (e.g., folder deleted externally). */
  get isNotFound(): boolean {
    return this.statusCode === 404;
  }
}
