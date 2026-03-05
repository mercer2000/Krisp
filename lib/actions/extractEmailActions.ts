import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_EMAIL_ACTIONS } from "@/lib/ai/prompts";

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
  userEmail?: string,
  userId?: string
): Promise<ExtractedEmailAction[]> {
  const body = email.bodyPlainText || "";
  if (!body.trim()) return [];

  const today = new Date().toISOString().split("T")[0];

  const instructions = userId
    ? await resolvePrompt(PROMPT_EMAIL_ACTIONS, userId)
    : (await import("@/lib/ai/prompts")).PROMPT_DEFAULTS[PROMPT_EMAIL_ACTIONS].defaultText;

  const prompt = `${instructions}

From: ${email.sender}
To: ${email.recipients.join(", ")}
Subject: ${email.subject || "(No subject)"}
Date: ${email.receivedAt}
${userEmail ? `Reader's email: ${userEmail}` : ""}

Email body:
${body.slice(0, 10000)}

Today's date: ${today}`;

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
