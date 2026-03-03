import { db } from "@/lib/db";
import { decisions } from "@/lib/db/schema";
import { getMeetingById } from "@/lib/krisp/webhookKeyPoints";
import { eq, and, isNull } from "drizzle-orm";
import { chatCompletion } from "@/lib/ai/client";

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
    return { decisions: items, count: 0 };
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

  const prompt = `Analyze this meeting and extract any decisions that were made or agreed upon by participants.

Meeting: "${meeting.meeting_title || "Untitled"}"
Date: ${meetingDate}
Participants: ${speakerNames.join(", ") || "Unknown"}

Key Points:
${keyPoints.map((kp: string, i: number) => `${i + 1}. ${kp}`).join("\n")}

Transcript (excerpt):
${transcript.slice(0, 8000)}

Extract decisions as a JSON array. A decision is a clear choice, agreement, or resolution made during the meeting. Look for phrases like:
- "We decided to..."
- "Let's go with..."
- "We agreed that..."
- "The decision is to..."
- "We'll proceed with..."
- Approval or rejection of proposals

For each decision include:
- "statement": the decision statement (concise, clear, max 200 chars)
- "context": what led to this decision being made
- "rationale": why this decision was made (reasoning discussed)
- "participants": array of participant names involved in the decision
- "category": one of "technical", "process", "budget", "strategic", "other"
- "priority": "low", "medium", "high", or "urgent" based on impact
- "confidence": 0-100 score of how confident you are this is a real decision
- "decisionDate": "${meetingDate}"

Only include clear, definitive decisions. Do NOT include:
- Vague intentions or wishes
- Action items or tasks (those are separate)
- Ongoing discussions without resolution
- Hypothetical scenarios

If no decisions are found, return an empty array [].
Respond with ONLY a valid JSON array, no other text.`;

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
      .values({
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
      })
      .returning();
    insertedItems.push(inserted);
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
    return { decisions: items, count: 0 };
  }

  const today = new Date().toISOString().split("T")[0];

  const prompt = `Analyze this email and extract any decisions that were communicated or confirmed.

Subject: "${subject || "No Subject"}"
From: ${sender}
To: ${recipients.join(", ")}

Body:
${bodyText.slice(0, 8000)}

Extract decisions as a JSON array. A decision in an email might be:
- An approval or rejection
- A confirmed plan or direction
- A final choice communicated to the team
- Budget or resource allocation decisions

For each decision include:
- "statement": the decision statement (concise, max 200 chars)
- "context": what the email discussion was about
- "rationale": reasoning provided in the email
- "participants": array of people involved (sender + relevant recipients)
- "category": one of "technical", "process", "budget", "strategic", "other"
- "priority": "low", "medium", "high", or "urgent"
- "confidence": 0-100 confidence score
- "decisionDate": "${today}"

If no decisions are found, return an empty array [].
Respond with ONLY a valid JSON array, no other text.`;

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
      .values({
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
      })
      .returning();
    insertedItems.push(inserted);
  }

  return { decisions: insertedItems, count: insertedItems.length };
}
