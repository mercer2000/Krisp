import { chatCompletion } from "@/lib/ai/client";

export interface ExtractedEmailAction {
  title: string;
  description: string;
  type: "request" | "deadline" | "commitment" | "follow_up";
  assignee: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
}

/**
 * Scan an email body with Claude to detect requests, deadlines, and commitments.
 * Returns extracted action items for the sidebar suggestion panel.
 */
export async function extractActionsFromEmail(
  email: {
    sender: string;
    recipients: string[];
    subject: string | null;
    bodyPlainText: string | null;
    receivedAt: string;
  },
  userEmail?: string
): Promise<ExtractedEmailAction[]> {
  const body = email.bodyPlainText || "";
  if (!body.trim()) return [];

  const today = new Date().toISOString().split("T")[0];

  const prompt = `Analyze this email and extract specific action items — requests, deadlines, commitments, and follow-ups addressed to the reader.

From: ${email.sender}
To: ${email.recipients.join(", ")}
Subject: ${email.subject || "(No subject)"}
Date: ${email.receivedAt}
${userEmail ? `Reader's email: ${userEmail}` : ""}

Email body:
${body.slice(0, 10000)}

Today's date: ${today}

Extract action items as a JSON array. For each item include:
- "title": concise action title (max 100 chars)
- "description": what needs to be done, with relevant context from the email
- "type": one of "request" (someone asks you to do something), "deadline" (a date/time constraint), "commitment" (you or someone promised to do something), "follow_up" (something to follow up on)
- "assignee": who should do this (name or email from the participants, or null)
- "priority": "low", "medium", "high", or "urgent" based on urgency cues
- "dueDate": due date as YYYY-MM-DD if mentioned or inferable, or null

Only include clear, actionable items. Skip pleasantries, FYI-only info, and vague mentions.
If no action items are found, return an empty array [].
Respond with ONLY a valid JSON array, no other text.`;

  const text = await chatCompletion(prompt, { maxTokens: 2000 });

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    // Validate and normalize
    return parsed
      .filter(
        (item: Record<string, unknown>) =>
          item && typeof item.title === "string" && item.title.trim()
      )
      .map((item: Record<string, unknown>) => ({
        title: String(item.title).slice(0, 100),
        description: String(item.description || ""),
        type: ["request", "deadline", "commitment", "follow_up"].includes(
          item.type as string
        )
          ? item.type
          : "request",
        assignee: item.assignee ? String(item.assignee) : null,
        priority: ["low", "medium", "high", "urgent"].includes(
          item.priority as string
        )
          ? item.priority
          : "medium",
        dueDate: item.dueDate ? String(item.dueDate) : null,
      })) as ExtractedEmailAction[];
  } catch {
    console.error("Failed to parse email action extraction response:", text);
    return [];
  }
}
