import { db } from "@/lib/db";
import { decisions } from "@/lib/db/schema";
import { getMeetingById } from "@/lib/krisp/webhookKeyPoints";
import { eq, and, isNull } from "drizzle-orm";
import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_DECISIONS_MEETING, PROMPT_DECISIONS_EMAIL } from "@/lib/ai/prompts";
import {
  encryptFields,
  decryptFields,
  decryptRows,
  DECISION_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

interface ExtractedDecision {
  statement: string;
  context: string | null;
  rationale: string | null;
  participants: string[];
  category: "technical" | "process" | "budget" | "strategic" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  confidence: number;
  decisionDate: string | null;
}

interface ExtractionResult {
  decisions: (typeof decisions.$inferSelect)[];
  count: number;
}

/**
 * Extract decisions from a meeting using Claude AI.
 * Idempotent: skips extraction if decisions already exist for the meeting.
 */
export async function extractDecisionsFromMeeting(
  meetingId: number,
  userId: string
): Promise<ExtractionResult> {
  // Idempotency check
  const existing = await db
    .select({ id: decisions.id })
    .from(decisions)
    .where(
      and(
        eq(decisions.userId, userId),
        eq(decisions.meetingId, meetingId),
        isNull(decisions.deletedAt)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const items = await db
      .select()
      .from(decisions)
      .where(
        and(
          eq(decisions.userId, userId),
          eq(decisions.meetingId, meetingId),
          isNull(decisions.deletedAt)
        )
      );
    const decItems = decryptRows(items as Record<string, unknown>[], DECISION_ENCRYPTED_FIELDS) as typeof items;
    return { decisions: decItems, count: 0 };
  }

  const meeting = await getMeetingById(meetingId, userId);
  if (!meeting) {
    return { decisions: [], count: 0 };
  }

  const speakerNames = (
    meeting.speakers as {
      first_name?: string;
      last_name?: string;
      index: number;
    }[]
  )
    .map(
      (s) =>
        [s.first_name, s.last_name].filter(Boolean).join(" ") ||
        `Speaker ${s.index}`
    )
    .filter(Boolean);

  const contentArr = Array.isArray(meeting.content) ? meeting.content : [];
  const keyPoints = contentArr
    .filter((c) => typeof c === "object" && c !== null && "description" in c)
    .map((c) => (c as { description: string }).description);

  const transcript = meeting.raw_content || "";
  const meetingDate = meeting.meeting_start_date
    ? new Date(meeting.meeting_start_date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const instructions = await resolvePrompt(PROMPT_DECISIONS_MEETING, userId);

  const prompt = `${instructions}

Meeting: "${meeting.meeting_title || "Untitled"}"
Date: ${meetingDate}
Participants: ${speakerNames.join(", ") || "Unknown"}

Key Points:
${keyPoints.map((kp: string, i: number) => `${i + 1}. ${kp}`).join("\n")}

Transcript (excerpt):
${transcript.slice(0, 8000)}

Use decisionDate: "${meetingDate}"`;

  const text = await chatCompletion(prompt, { maxTokens: 2500 });

  let extracted: ExtractedDecision[];
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    console.error("Failed to parse AI decisions response:", text);
    return { decisions: [], count: 0 };
  }

  if (extracted.length === 0) {
    return { decisions: [], count: 0 };
  }

  const insertedItems: (typeof decisions.$inferSelect)[] = [];
  for (const item of extracted) {
    const [inserted] = await db
      .insert(decisions)
      .values(
        encryptFields({
          userId,
          meetingId,
          statement: item.statement.slice(0, 500),
          context: item.context || null,
          rationale: item.rationale || null,
          participants: item.participants || [],
          category: item.category || "other",
          priority: item.priority || "medium",
          extractionSource: "ai_detection",
          confidence: item.confidence ?? 80,
          decisionDate: item.decisionDate ? new Date(item.decisionDate) : null,
        }, DECISION_ENCRYPTED_FIELDS)
      )
      .returning();
    insertedItems.push(decryptFields(inserted as Record<string, unknown>, DECISION_ENCRYPTED_FIELDS) as typeof inserted);
  }

  return { decisions: insertedItems, count: insertedItems.length };
}

/**
 * Extract decisions from an email body using Claude AI.
 */
export async function extractDecisionsFromEmail(
  emailId: number,
  subject: string,
  bodyText: string,
  sender: string,
  recipients: string[],
  userId: string
): Promise<ExtractionResult> {
  // Idempotency check
  const existing = await db
    .select({ id: decisions.id })
    .from(decisions)
    .where(
      and(
        eq(decisions.userId, userId),
        eq(decisions.emailId, emailId),
        isNull(decisions.deletedAt)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const items = await db
      .select()
      .from(decisions)
      .where(
        and(
          eq(decisions.userId, userId),
          eq(decisions.emailId, emailId),
          isNull(decisions.deletedAt)
        )
      );
    const decItems = decryptRows(items as Record<string, unknown>[], DECISION_ENCRYPTED_FIELDS) as typeof items;
    return { decisions: decItems, count: 0 };
  }

  const today = new Date().toISOString().split("T")[0];

  const instructions = await resolvePrompt(PROMPT_DECISIONS_EMAIL, userId);

  const prompt = `${instructions}

Subject: "${subject || "No Subject"}"
From: ${sender}
To: ${recipients.join(", ")}

Body:
${bodyText.slice(0, 8000)}

Use decisionDate: "${today}"`;

  const text = await chatCompletion(prompt, { maxTokens: 2000 });

  let extracted: ExtractedDecision[];
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    console.error("Failed to parse AI email decisions response:", text);
    return { decisions: [], count: 0 };
  }

  if (extracted.length === 0) {
    return { decisions: [], count: 0 };
  }

  const insertedItems: (typeof decisions.$inferSelect)[] = [];
  for (const item of extracted) {
    const [inserted] = await db
      .insert(decisions)
      .values(
        encryptFields({
          userId,
          emailId,
          statement: item.statement.slice(0, 500),
          context: item.context || null,
          rationale: item.rationale || null,
          participants: item.participants || [],
          category: item.category || "other",
          priority: item.priority || "medium",
          extractionSource: "ai_detection",
          confidence: item.confidence ?? 80,
          decisionDate: item.decisionDate ? new Date(item.decisionDate) : null,
        }, DECISION_ENCRYPTED_FIELDS)
      )
      .returning();
    insertedItems.push(decryptFields(inserted as Record<string, unknown>, DECISION_ENCRYPTED_FIELDS) as typeof inserted);
  }

  return { decisions: insertedItems, count: insertedItems.length };
}
