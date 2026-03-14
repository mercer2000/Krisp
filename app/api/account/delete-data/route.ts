import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  users,
  boards,
  emails,
  gmailEmails,
  gmailWatchSubscriptions,
  emailLabels,
  emailContacts,
  emailDrafts,
  vipContacts,
  newsletterWhitelist,
  webhookKeyPoints,
  decisions,
  actionItems,
  brainThoughts,
  brainChatSessions,
  thoughtLinks,
  thoughtReminders,
  workspaces,
  calendarEvents,
  calendarSyncState,
  weeklyReviews,
  dailyBriefings,
  zoomChatMessages,
  zoomOauthTokens,
  zoomUserOauthTokens,
  graphCredentials,
  graphSubscriptions,
  outlookOauthTokens,
  googleOauthTokens,
  smartLabels,
  customPrompts,
  customPromptHistory,
  webhookSecrets,
  outboundWebhooks,
  telegramBotTokens,
  zapierIngestLogs,
  extensionDownloads,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAndSend } from "@/lib/email/log";

const CONFIRMATION_PHRASE = "DELETE MY DATA";

const VALID_CATEGORIES = [
  "inbox",
  "kanban",
  "meetings",
  "brain",
  "pages",
  "action_items",
  "calendar",
  "decisions",
  "settings",
] as const;

type Category = (typeof VALID_CATEGORIES)[number];

// Simple in-memory rate limiter (per-process; sufficient for serverless)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: "Too many deletion requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { categories, confirmationPhrase } = body as {
      categories: string[];
      confirmationPhrase: string;
    };

    // Validate confirmation phrase server-side
    if (
      !confirmationPhrase ||
      confirmationPhrase.trim().toUpperCase() !== CONFIRMATION_PHRASE
    ) {
      return NextResponse.json(
        { error: "Invalid confirmation phrase" },
        { status: 400 }
      );
    }

    // Validate categories
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: "At least one category must be selected" },
        { status: 400 }
      );
    }

    const invalidCategories = categories.filter(
      (c) => !VALID_CATEGORIES.includes(c as Category)
    );
    if (invalidCategories.length > 0) {
      return NextResponse.json(
        { error: `Invalid categories: ${invalidCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const selectedCategories = categories as Category[];
    const deletedCategories: string[] = [];

    // Execute all deletions in a transaction
    await db.transaction(async (tx) => {
      // Delete each category. Child records cascade via FK constraints.
      for (const category of selectedCategories) {
        switch (category) {
          case "inbox": {
            // Email-related: emails (with embeddings), gmail, labels, contacts, drafts, VIP, newsletters
            // Also clean up Gmail watch subscriptions and OAuth tokens
            await tx.delete(emailDrafts).where(eq(emailDrafts.tenantId, userId));
            await tx.delete(vipContacts).where(eq(vipContacts.tenantId, userId));
            await tx
              .delete(newsletterWhitelist)
              .where(eq(newsletterWhitelist.tenantId, userId));
            await tx
              .delete(emailContacts)
              .where(eq(emailContacts.tenantId, userId));
            await tx
              .delete(emailLabels)
              .where(eq(emailLabels.tenantId, userId));
            // emails table has cascade for emailLabelAssignments
            await tx.delete(emails).where(eq(emails.tenantId, userId));
            await tx
              .delete(gmailEmails)
              .where(eq(gmailEmails.tenantId, userId));
            // Unsubscribe from Gmail push notifications
            await tx
              .delete(gmailWatchSubscriptions)
              .where(eq(gmailWatchSubscriptions.tenantId, userId));
            // Zoom chat messages (part of inbox)
            await tx
              .delete(zoomChatMessages)
              .where(eq(zoomChatMessages.tenantId, userId));
            // Smart labels and context entries (cascade from smartLabels)
            await tx
              .delete(smartLabels)
              .where(eq(smartLabels.tenantId, userId));
            // Daily briefings (derived from email data)
            await tx
              .delete(dailyBriefings)
              .where(eq(dailyBriefings.userId, userId));
            // Weekly reviews
            await tx
              .delete(weeklyReviews)
              .where(eq(weeklyReviews.userId, userId));
            deletedCategories.push("Inbox / Emails");
            break;
          }

          case "kanban": {
            // boards cascade → columns → cards → card_tags
            await tx.delete(boards).where(eq(boards.userId, userId));
            // Clear board references on user
            await tx
              .update(users)
              .set({
                defaultBoardId: null,
                emailActionBoardId: null,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId));
            deletedCategories.push("Kanban Boards");
            break;
          }

          case "meetings": {
            // webhookKeyPoints. Decisions & actionItems reference meetingId but with SET NULL.
            await tx
              .delete(webhookKeyPoints)
              .where(eq(webhookKeyPoints.userId, userId));
            deletedCategories.push("Meeting Transcripts");
            break;
          }

          case "brain": {
            // brainThoughts (with embeddings) — cascades thoughtLinks, thoughtReminders
            await tx
              .delete(brainThoughts)
              .where(eq(brainThoughts.userId, userId));
            // brainChatSessions — cascades brainChatMessages
            await tx
              .delete(brainChatSessions)
              .where(eq(brainChatSessions.userId, userId));
            deletedCategories.push("Open Brain Memories");
            break;
          }

          case "pages": {
            // workspaces cascade → pages → blocks, databaseRows, pageEntries
            await tx
              .delete(workspaces)
              .where(eq(workspaces.ownerId, userId));
            deletedCategories.push("Pages / Notes");
            break;
          }

          case "action_items": {
            await tx
              .delete(actionItems)
              .where(eq(actionItems.userId, userId));
            deletedCategories.push("Action Items");
            break;
          }

          case "calendar": {
            await tx
              .delete(calendarEvents)
              .where(eq(calendarEvents.tenantId, userId));
            await tx
              .delete(calendarSyncState)
              .where(eq(calendarSyncState.tenantId, userId));
            // Clean up Graph (Microsoft) subscriptions
            await tx
              .delete(graphSubscriptions)
              .where(eq(graphSubscriptions.tenantId, userId));
            deletedCategories.push("Calendar Events");
            break;
          }

          case "decisions": {
            await tx
              .delete(decisions)
              .where(eq(decisions.userId, userId));
            deletedCategories.push("Decisions");
            break;
          }

          case "settings": {
            // Integrations, webhooks, tokens, prompts
            await tx
              .delete(googleOauthTokens)
              .where(eq(googleOauthTokens.tenantId, userId));
            await tx
              .delete(outlookOauthTokens)
              .where(eq(outlookOauthTokens.tenantId, userId));
            await tx
              .delete(graphCredentials)
              .where(eq(graphCredentials.tenantId, userId));
            await tx
              .delete(zoomOauthTokens)
              .where(eq(zoomOauthTokens.tenantId, userId));
            await tx
              .delete(zoomUserOauthTokens)
              .where(eq(zoomUserOauthTokens.tenantId, userId));
            await tx
              .delete(webhookSecrets)
              .where(eq(webhookSecrets.userId, userId));
            await tx
              .delete(outboundWebhooks)
              .where(eq(outboundWebhooks.userId, userId));
            await tx
              .delete(telegramBotTokens)
              .where(eq(telegramBotTokens.userId, userId));
            await tx
              .delete(customPrompts)
              .where(eq(customPrompts.userId, userId));
            await tx
              .delete(customPromptHistory)
              .where(eq(customPromptHistory.userId, userId));
            await tx
              .delete(zapierIngestLogs)
              .where(eq(zapierIngestLogs.userId, userId));
            await tx
              .delete(extensionDownloads)
              .where(eq(extensionDownloads.userId, userId));
            deletedCategories.push("Settings & Integrations");
            break;
          }
        }
      }
    });

    const isFullWipe = selectedCategories.length === VALID_CATEGORIES.length;

    // Send confirmation email via Resend
    if (userEmail) {
      try {
        const now = new Date().toLocaleString("en-US", {
          dateStyle: "full",
          timeStyle: "short",
        });
        await logAndSend({
          to: userEmail,
          subject: "MyOpenBrain — Your data has been deleted",
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:24px 32px;color:#fff;">
        <h1 style="margin:0;font-size:20px;">Data Deletion Confirmation</h1>
        <p style="margin:6px 0 0;opacity:0.9;font-size:13px;">${now}</p>
      </div>
      <div style="padding:24px 32px;color:#374151;font-size:14px;line-height:1.7;">
        <p>The following data categories have been permanently deleted from your MyOpenBrain account:</p>
        <ul style="padding-left:20px;">
          ${deletedCategories.map((c) => `<li>${c}</li>`).join("")}
        </ul>
        <p style="color:#6b7280;font-size:12px;margin-top:20px;">This action is irreversible. If you did not initiate this deletion, please contact support immediately.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
          userId: session.user.id,
          type: "account.deletion",
        });
      } catch (emailErr) {
        // Non-fatal: log but don't fail the request
        console.error("Failed to send deletion confirmation email:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCategories,
      isFullWipe,
    });
  } catch (error) {
    console.error("Error deleting account data:", error);
    return NextResponse.json(
      { error: "Failed to delete data. The operation has been rolled back." },
      { status: 500 }
    );
  }
}
