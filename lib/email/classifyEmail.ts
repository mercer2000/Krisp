import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_EMAIL_CLASSIFY } from "@/lib/ai/prompts";
import {
  ensureSystemLabels,
  assignLabelsToEmail,
  isEmailClassified,
  type EmailLabel,
} from "./labels";

interface ClassificationResult {
  labels: string[];
  confidence: Record<string, number>;
}

/**
 * Classify a single email using Claude AI and assign matching labels.
 * Idempotent: skips if the email already has AI-assigned labels.
 */
export async function classifyEmail(
  emailId: number,
  tenantId: string,
  email: {
    sender: string;
    subject: string | null;
    bodyPlainText: string | null;
    recipients: string[];
  }
): Promise<{ labels: string[]; skipped: boolean }> {
  // Idempotency check
  if (await isEmailClassified(emailId)) {
    return { labels: [], skipped: true };
  }

  // Ensure system labels exist for this tenant
  const allLabels = await ensureSystemLabels(tenantId);
  const labelNames = allLabels.map((l) => l.name);

  const instructions = await resolvePrompt(PROMPT_EMAIL_CLASSIFY, tenantId);

  const prompt = `${instructions}

Available labels:
${labelNames.map((n) => `- "${n}"`).join("\n")}

Email:
From: ${email.sender}
To: ${email.recipients.join(", ")}
Subject: ${email.subject || "(No subject)"}
Body:
${(email.bodyPlainText || "").slice(0, 3000)}`;

  const text = await chatCompletion(prompt, { maxTokens: 500 });

  let result: ClassificationResult;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { labels: [], confidence: {} };
  } catch {
    console.error("Failed to parse classification response:", text);
    return { labels: [], skipped: false };
  }

  if (result.labels.length === 0) {
    return { labels: [], skipped: false };
  }

  // Map label names to IDs and assign
  const labelMap = new Map<string, EmailLabel>(
    allLabels.map((l) => [l.name, l])
  );

  const assignments: { labelId: string; confidence: number; assignedBy: string }[] = [];
  for (const labelName of result.labels) {
    const label = labelMap.get(labelName);
    if (label) {
      assignments.push({
        labelId: label.id,
        confidence: result.confidence[labelName] ?? 80,
        assignedBy: "ai",
      });
    }
  }

  if (assignments.length > 0) {
    await assignLabelsToEmail(emailId, assignments);
  }

  return { labels: result.labels, skipped: false };
}

/**
 * Classify multiple unclassified emails in batch.
 */
export async function classifyUnclassifiedEmails(
  tenantId: string,
  emailBatch: {
    id: number;
    sender: string;
    subject: string | null;
    body_plain_text: string | null;
    recipients: string[];
  }[]
): Promise<{ classified: number; skipped: number; errors: number }> {
  let classified = 0;
  let skipped = 0;
  let errors = 0;

  for (const email of emailBatch) {
    try {
      const result = await classifyEmail(email.id, tenantId, {
        sender: email.sender,
        subject: email.subject,
        bodyPlainText: email.body_plain_text,
        recipients: email.recipients,
      });

      if (result.skipped) {
        skipped++;
      } else if (result.labels.length > 0) {
        classified++;
      }
    } catch (err) {
      console.error(`Failed to classify email ${email.id}:`, err);
      errors++;
    }
  }

  return { classified, skipped, errors };
}
