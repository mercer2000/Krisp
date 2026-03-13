import { db } from "@/lib/db";
import {
  weeklyPlans,
  dailyThemes,
  cards,
  actionItems,
  webhookKeyPoints,
} from "@/lib/db/schema";
import { eq, and, gte, lte, isNull, isNotNull, desc } from "drizzle-orm";
import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_WEEK_ASSESSMENT } from "@/lib/ai/prompts";
import {
  decryptFields,
  encryptFields,
  CARD_ENCRYPTED_FIELDS,
  WEEKLY_PLAN_ENCRYPTED_FIELDS,
  DAILY_THEME_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";
import type { AssessmentResult } from "./types";

/**
 * Generate an AI-powered weekly assessment for a given plan.
 *
 * 1. Fetches the plan, Big 3 cards, daily themes, action items, meetings
 * 2. Checks reflection streak
 * 3. Calls the AI with the week_assessment prompt
 * 4. Saves the encrypted assessment and score to the plan
 */
export async function generateAssessment(
  planId: string,
  userId: string
): Promise<AssessmentResult> {
  // 1. Fetch the plan
  const [plan] = await db
    .select()
    .from(weeklyPlans)
    .where(and(eq(weeklyPlans.id, planId), eq(weeklyPlans.userId, userId)));

  if (!plan) {
    throw new Error("Weekly plan not found");
  }

  // 2. Fetch Big 3 cards and check their status (archived = completed)
  const bigThreeIds = (plan.bigThreeCardIds ?? []) as string[];
  const bigThreeCards = bigThreeIds.length
    ? await Promise.all(
        bigThreeIds.map(async (cardId) => {
          const [card] = await db
            .select()
            .from(cards)
            .where(eq(cards.id, cardId));
          if (!card) return null;
          return decryptFields(card, CARD_ENCRYPTED_FIELDS);
        })
      )
    : [];

  const bigThreeData = bigThreeCards
    .filter(Boolean)
    .map((card) => ({
      cardId: card!.id,
      title: card!.title,
      archived: card!.archived,
      priority: card!.priority,
    }));

  // 3. Fetch daily themes for the plan
  const themes = await db
    .select()
    .from(dailyThemes)
    .where(eq(dailyThemes.weeklyPlanId, planId));

  const decryptedThemes = themes.map((t) =>
    decryptFields(t, DAILY_THEME_ENCRYPTED_FIELDS)
  );

  // 4. Fetch action items created during the plan week
  const weekStart = plan.weekStart;
  const weekEnd = plan.weekEnd;

  const weekActionItems = await db
    .select()
    .from(actionItems)
    .where(
      and(
        eq(actionItems.userId, userId),
        gte(actionItems.createdAt, new Date(weekStart)),
        lte(actionItems.createdAt, new Date(weekEnd + "T23:59:59Z")),
        isNull(actionItems.deletedAt)
      )
    );

  const totalActionItems = weekActionItems.length;
  const closedActionItems = weekActionItems.filter(
    (ai) => ai.status === "completed"
  ).length;

  // 5. Count meetings during the plan week
  const meetings = await db
    .select()
    .from(webhookKeyPoints)
    .where(
      and(
        eq(webhookKeyPoints.userId, userId),
        gte(webhookKeyPoints.meetingStartDate, new Date(weekStart)),
        lte(webhookKeyPoints.meetingStartDate, new Date(weekEnd + "T23:59:59Z")),
        isNull(webhookKeyPoints.deletedAt)
      )
    );

  const meetingCount = meetings.length;

  // 6. Check reflection streak (count recent assessed plans with userReflection)
  const recentAssessedPlans = await db
    .select({ userReflection: weeklyPlans.userReflection })
    .from(weeklyPlans)
    .where(
      and(
        eq(weeklyPlans.userId, userId),
        eq(weeklyPlans.status, "assessed"),
        isNotNull(weeklyPlans.userReflection)
      )
    )
    .orderBy(desc(weeklyPlans.weekStart))
    .limit(10);

  // Count consecutive weeks with reflection (streak)
  const reflectionStreak = recentAssessedPlans.length;

  // 7. Build prompt with all data and call AI
  const promptTemplate = await resolvePrompt(PROMPT_WEEK_ASSESSMENT, userId);

  const contextData = `
## Week: ${weekStart} to ${weekEnd}

## Big 3 Items:
${bigThreeData
  .map(
    (c) =>
      `- ${c.title} (priority: ${c.priority}, ${c.archived ? "COMPLETED (archived)" : "NOT completed"})`
  )
  .join("\n")}

## Daily Themes:
${decryptedThemes
  .map((t) => `- ${t.date}: "${t.theme}" ${t.aiRationale ? `— ${t.aiRationale}` : ""}`)
  .join("\n")}

## Action Items This Week:
- Total: ${totalActionItems}
- Completed: ${closedActionItems}
- Closure rate: ${totalActionItems > 0 ? Math.round((closedActionItems / totalActionItems) * 100) : 0}%

## Meetings This Week: ${meetingCount}

## Reflection Streak: ${reflectionStreak} consecutive weeks with reflection
`;

  const fullPrompt = `${promptTemplate}\n\n${contextData}`;

  const response = await chatCompletion(fullPrompt, {
    maxTokens: 2000,
    userId,
  });

  // 8. Parse JSON response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse assessment response from AI");
  }

  const assessment: AssessmentResult = JSON.parse(jsonMatch[0]);

  // 9. Save assessment to plan (encrypt aiAssessment, set assessmentScore)
  const encryptedValues = encryptFields(
    { aiAssessment: JSON.stringify(assessment) },
    WEEKLY_PLAN_ENCRYPTED_FIELDS
  );

  await db
    .update(weeklyPlans)
    .set({
      aiAssessment: encryptedValues.aiAssessment,
      assessmentScore: assessment.score,
      updatedAt: new Date(),
    })
    .where(and(eq(weeklyPlans.id, planId), eq(weeklyPlans.userId, userId)));

  // 10. Return the result
  return assessment;
}

/**
 * Save a user reflection on the weekly plan and mark it as assessed.
 */
export async function saveReflection(
  planId: string,
  userId: string,
  reflection: string
): Promise<void> {
  // 1. Encrypt the reflection
  const encryptedValues = encryptFields(
    { userReflection: reflection },
    WEEKLY_PLAN_ENCRYPTED_FIELDS
  );

  // 2. Update the plan: set userReflection, set status to "assessed"
  await db
    .update(weeklyPlans)
    .set({
      userReflection: encryptedValues.userReflection,
      status: "assessed",
      updatedAt: new Date(),
    })
    .where(and(eq(weeklyPlans.id, planId), eq(weeklyPlans.userId, userId)));
}
