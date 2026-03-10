import sql from "./db";
import { getValidOutlookAccessToken, getOutlookTokensForTenant } from "@/lib/outlook/oauth";
import {
  createMailFolder,
  findMailFolderByName,
  getMailFolderById,
  renameMailFolder,
  moveMessageToFolder,
  getMessageParentFolder,
  GraphApiError,
} from "@/lib/outlook/folders";
import type { SmartLabel } from "@/types/smartLabel";

/**
 * Provision an Outlook mail folder for a smart label.
 * - If a folder with the same name already exists, link to it.
 * - Stores the graphFolderId and sets folderSyncStatus = "synced".
 *
 * Called after smart label creation if the user has an active Outlook account.
 */
export async function provisionFolderForLabel(
  label: SmartLabel,
  outlookAccountId: string
): Promise<{ graphFolderId: string; status: "synced" | "failed" }> {
  let accessToken: string;
  try {
    accessToken = await getValidOutlookAccessToken(outlookAccountId, label.tenant_id);
  } catch (err) {
    console.error(`[FolderSync] Auth failed for label "${label.name}":`, err);
    await updateLabelFolderStatus(label.id, label.tenant_id, "failed", null, outlookAccountId);
    return { graphFolderId: "", status: "failed" };
  }

  try {
    // Try to find an existing folder with the same name
    let folder = await findMailFolderByName(accessToken, label.name);

    if (!folder) {
      // Create a new folder
      folder = await createMailFolder(accessToken, label.name);
    }

    await updateLabelFolderStatus(label.id, label.tenant_id, "synced", folder.id, outlookAccountId);
    return { graphFolderId: folder.id, status: "synced" };
  } catch (err) {
    console.error(`[FolderSync] Failed to provision folder for label "${label.name}":`, err);
    const status = "failed";
    await updateLabelFolderStatus(label.id, label.tenant_id, status, null, outlookAccountId);
    return { graphFolderId: "", status };
  }
}

/**
 * Rename the Outlook folder linked to a smart label.
 * Called when a smart label is renamed.
 */
export async function renameFolderForLabel(
  label: SmartLabel,
  newName: string
): Promise<boolean> {
  if (!label.graph_folder_id || !label.outlook_account_id) return false;
  if (label.folder_sync_status !== "synced") return false;

  let accessToken: string;
  try {
    accessToken = await getValidOutlookAccessToken(label.outlook_account_id, label.tenant_id);
  } catch (err) {
    console.error(`[FolderSync] Auth failed for rename of label "${label.name}":`, err);
    return false;
  }

  try {
    // Check if the folder still exists (may have been deleted externally)
    const existing = await getMailFolderById(accessToken, label.graph_folder_id);
    if (!existing) {
      // Folder was deleted externally — re-provision with the new name
      const reprovisionedLabel = { ...label, name: newName };
      await provisionFolderForLabel(reprovisionedLabel, label.outlook_account_id);
      return true;
    }

    await renameMailFolder(accessToken, label.graph_folder_id, newName);
    return true;
  } catch (err) {
    console.error(`[FolderSync] Failed to rename folder for label "${label.name}":`, err);
    return false;
  }
}

/**
 * Unlink a smart label from its Outlook folder (on label deletion).
 * Does NOT delete the Outlook folder — just removes the association.
 */
export async function unlinkFolderForLabel(
  labelId: string,
  tenantId: string
): Promise<void> {
  await sql`
    UPDATE smart_labels
    SET graph_folder_id = NULL,
        folder_sync_status = 'unlinked',
        updated_at = NOW()
    WHERE id = ${labelId} AND tenant_id = ${tenantId}
  `;
}

/**
 * Move a message to the smart label's Outlook folder.
 * Idempotent — skips if already in the correct folder.
 *
 * @returns "moved" | "skipped" | "queued" | "failed"
 */
export async function moveMessageToLabelFolder(
  label: SmartLabel,
  graphMessageId: string,
  emailId: string
): Promise<"moved" | "skipped" | "queued" | "failed"> {
  if (!label.graph_folder_id || !label.outlook_account_id) return "skipped";
  if (label.folder_sync_status !== "synced") return "skipped";
  if (!label.active) return "skipped";

  let accessToken: string;
  try {
    accessToken = await getValidOutlookAccessToken(label.outlook_account_id, label.tenant_id);
  } catch (err) {
    console.error(`[FolderSync] Auth failed for move, label "${label.name}":`, err);
    await queueFailedMove(label, emailId, graphMessageId, String(err));
    return "queued";
  }

  try {
    // Idempotency check — skip if already in the target folder
    const currentParent = await getMessageParentFolder(accessToken, graphMessageId);
    if (currentParent === label.graph_folder_id) {
      return "skipped";
    }

    // Check if folder still exists (may have been deleted externally)
    const folder = await getMailFolderById(accessToken, label.graph_folder_id);
    if (!folder) {
      // Re-provision the folder
      console.warn(`[FolderSync] Folder missing for label "${label.name}", re-provisioning`);
      const result = await provisionFolderForLabel(label, label.outlook_account_id);
      if (result.status !== "synced" || !result.graphFolderId) return "failed";
      // Update the label reference for this operation
      label = { ...label, graph_folder_id: result.graphFolderId };
    }

    await moveMessageToFolder(accessToken, graphMessageId, label.graph_folder_id!);
    return "moved";
  } catch (err) {
    if (err instanceof GraphApiError) {
      if (err.isAuthError) {
        console.error(`[FolderSync] Auth revoked for label "${label.name}"`);
        await updateLabelFolderStatus(label.id, label.tenant_id, "failed", label.graph_folder_id, label.outlook_account_id);
      } else if (err.isQuotaError) {
        console.warn(`[FolderSync] Mailbox quota exceeded for label "${label.name}"`);
      } else if (err.isRateLimited) {
        console.warn(`[FolderSync] Rate limited, queueing move for label "${label.name}"`);
        await queueFailedMove(label, emailId, graphMessageId, "Rate limited");
        return "queued";
      }
    }
    console.error(`[FolderSync] Failed to move message for label "${label.name}":`, err);
    await queueFailedMove(label, emailId, graphMessageId, String(err));
    return "queued";
  }
}

/**
 * After classification, move matching emails to their highest-priority label's folder.
 * First-match-wins strategy: the first active label with a synced folder gets the message.
 */
export async function moveEmailAfterClassification(
  emailId: string,
  tenantId: string,
  matchedLabelNames: string[]
): Promise<void> {
  if (matchedLabelNames.length === 0) return;

  // Get the email's Graph message ID
  const emailRows = await sql`
    SELECT message_id FROM emails
    WHERE id = ${parseInt(emailId, 10)} AND tenant_id = ${tenantId} AND deleted_at IS NULL
  `;
  if (emailRows.length === 0) return;
  const { message_id: graphMessageId } = emailRows[0] as { message_id: string };

  if (!graphMessageId) return;

  // Get the matched labels with folder info (ordered by creation date for tie-breaking)
  const labels = await sql`
    SELECT id, tenant_id, name, prompt, color, active,
           auto_draft_enabled, context_window_max,
           graph_folder_id, folder_sync_status, outlook_account_id,
           created_at, updated_at
    FROM smart_labels
    WHERE tenant_id = ${tenantId}
      AND name = ANY(${matchedLabelNames})
      AND active = true
      AND folder_sync_status = 'synced'
      AND graph_folder_id IS NOT NULL
      AND outlook_account_id IS NOT NULL
    ORDER BY created_at ASC
    LIMIT 1
  `;

  if (labels.length === 0) return;

  const label = labels[0] as SmartLabel;
  await moveMessageToLabelFolder(label, graphMessageId, emailId);
}

/**
 * Get the first active Outlook account for a tenant, if any.
 */
export async function getDefaultOutlookAccountId(
  tenantId: string
): Promise<string | null> {
  const accounts = await getOutlookTokensForTenant(tenantId);
  if (accounts.length === 0) return null;
  return accounts[0].id;
}

/**
 * Queue a failed move operation for retry with exponential backoff.
 */
async function queueFailedMove(
  label: SmartLabel,
  emailId: string,
  graphMessageId: string,
  error: string
): Promise<void> {
  try {
    await sql.query(
      `INSERT INTO folder_move_queue (
        tenant_id, label_id, email_id, graph_message_id,
        graph_folder_id, outlook_account_id, status,
        attempts, last_error, next_retry_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'pending',
        1, $7,
        NOW() + INTERVAL '30 seconds'
      )
      ON CONFLICT (email_id, label_id) DO UPDATE SET
        attempts = folder_move_queue.attempts + 1,
        last_error = EXCLUDED.last_error,
        next_retry_at = NOW() + (INTERVAL '1 second' * (30 * power(2, LEAST(folder_move_queue.attempts, 7)))),
        status = 'pending',
        updated_at = NOW()`,
      [
        label.tenant_id,
        label.id,
        emailId,
        graphMessageId,
        label.graph_folder_id,
        label.outlook_account_id,
        error.slice(0, 1000),
      ]
    );
  } catch (err) {
    console.error("[FolderSync] Failed to queue move:", err);
  }
}

/**
 * Process pending items in the folder move queue.
 * Called by a cron job or background task.
 */
export async function processRetryQueue(limit: number = 10): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const rows = await sql`
    SELECT fmq.*, sl.name as label_name, sl.active as label_active,
           sl.folder_sync_status, sl.graph_folder_id as current_folder_id
    FROM folder_move_queue fmq
    JOIN smart_labels sl ON sl.id = fmq.label_id
    WHERE fmq.status = 'pending'
      AND fmq.next_retry_at <= NOW()
      AND fmq.attempts < 10
    ORDER BY fmq.next_retry_at ASC
    LIMIT ${limit}
  `;

  let succeeded = 0;
  let failed = 0;

  for (const row of rows as (Record<string, unknown>)[]) {
    const queueId = row.id as string;
    const labelId = row.label_id as string;
    const tenantId = row.tenant_id as string;
    const graphMessageId = row.graph_message_id as string;
    const graphFolderId = (row.current_folder_id || row.graph_folder_id) as string;
    const outlookAccountId = row.outlook_account_id as string;
    const labelActive = row.label_active as boolean;
    const folderSyncStatus = row.folder_sync_status as string;

    // Skip if label is no longer active or synced
    if (!labelActive || folderSyncStatus !== "synced" || !graphFolderId) {
      await sql`
        UPDATE folder_move_queue SET status = 'skipped', updated_at = NOW()
        WHERE id = ${queueId}
      `;
      continue;
    }

    try {
      const accessToken = await getValidOutlookAccessToken(outlookAccountId, tenantId);

      // Idempotency check
      const currentParent = await getMessageParentFolder(accessToken, graphMessageId);
      if (currentParent === graphFolderId) {
        await sql`
          UPDATE folder_move_queue SET status = 'success', updated_at = NOW()
          WHERE id = ${queueId}
        `;
        succeeded++;
        continue;
      }

      await moveMessageToFolder(accessToken, graphMessageId, graphFolderId);
      await sql`
        UPDATE folder_move_queue SET status = 'success', updated_at = NOW()
        WHERE id = ${queueId}
      `;
      succeeded++;
    } catch (err) {
      const attempts = (row.attempts as number) + 1;
      const maxAttempts = 10;

      if (attempts >= maxAttempts) {
        await sql`
          UPDATE folder_move_queue
          SET status = 'failed', last_error = ${String(err).slice(0, 1000)}, attempts = ${attempts}, updated_at = NOW()
          WHERE id = ${queueId}
        `;
        failed++;
      } else {
        // Exponential backoff: 30s * 2^attempts, max ~1hr
        const backoffSeconds = Math.min(30 * Math.pow(2, attempts), 3600);
        await sql.query(
          `UPDATE folder_move_queue
           SET attempts = $1, last_error = $2,
               next_retry_at = NOW() + INTERVAL '1 second' * $3,
               updated_at = NOW()
           WHERE id = $4`,
          [attempts, String(err).slice(0, 1000), backoffSeconds, queueId]
        );
        failed++;
      }
    }
  }

  return { processed: rows.length, succeeded, failed };
}

/**
 * Update the folder sync status on a smart label.
 */
async function updateLabelFolderStatus(
  labelId: string,
  tenantId: string,
  status: string,
  graphFolderId: string | null,
  outlookAccountId: string | null
): Promise<void> {
  if (graphFolderId) {
    await sql`
      UPDATE smart_labels
      SET folder_sync_status = ${status},
          graph_folder_id = ${graphFolderId},
          outlook_account_id = ${outlookAccountId},
          updated_at = NOW()
      WHERE id = ${labelId} AND tenant_id = ${tenantId}
    `;
  } else {
    await sql`
      UPDATE smart_labels
      SET folder_sync_status = ${status},
          outlook_account_id = ${outlookAccountId},
          updated_at = NOW()
      WHERE id = ${labelId} AND tenant_id = ${tenantId}
    `;
  }
}
