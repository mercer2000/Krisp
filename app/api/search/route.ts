import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_SEARCH_OPTIMIZER, PROMPT_SEARCH_ANSWER } from "@/lib/ai/prompts";
import { auth } from "@/auth";
import {
  searchMeetings,
  searchMeetingsSimple,
  getAllMeetingsSummary,
  getMeetingById,
} from "@/lib/krisp/webhookKeyPoints";
import type { WebhookKeyPointsRow } from "@/types/webhook";

interface SearchResult {
  meetings: WebhookKeyPointsRow[];
  answer: string;
  searchQuery: string;
}

/**
 * Get the authenticated user's ID from the session.
 * Returns null if not authenticated.
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * POST /api/search
 * Natural language search across meeting transcripts using LLM
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Step 1: Use LLM to extract search terms from natural language query
    const searchTerms = await extractSearchTerms(query, userId);

    // Step 2: Search the database for relevant meetings (scoped to user)
    let meetings = await searchMeetings(searchTerms, userId, 10);

    // Fallback to simple search if full-text search returns no results
    if (meetings.length === 0) {
      meetings = await searchMeetingsSimple(searchTerms, userId, 10);
    }

    // Also try searching with individual words if still no results
    if (meetings.length === 0) {
      const words = searchTerms.split(/\s+/).filter(w => w.length > 2);
      for (const word of words) {
        const wordResults = await searchMeetingsSimple(word, userId, 10);
        if (wordResults.length > 0) {
          meetings = wordResults;
          break;
        }
      }
    }

    // Step 3: Always fetch recent meetings so the LLM has context for
    // temporal queries like "last meeting" or "most recent 1:1"
    const { getRecentWebhookKeyPoints } = await import("@/lib/krisp/webhookKeyPoints");
    const recentMeetings = await getRecentWebhookKeyPoints(userId, 5);

    // Merge: search results first, then recent meetings (deduplicated)
    const seenIds = new Set(meetings.map(m => m.id));
    const allMeetings = [
      ...meetings,
      ...recentMeetings.filter(m => !seenIds.has(m.id)),
    ];

    if (allMeetings.length === 0) {
      return NextResponse.json({
        meetings: [],
        answer: `No meetings found yet. Meetings will appear here once Krisp sends webhook data.`,
        searchQuery: searchTerms,
      } as SearchResult);
    }

    // Step 4: Use LLM to generate an answer based on the query and all available meeting data
    const answer = await generateAnswer(query, allMeetings, userId);

    return NextResponse.json({
      meetings: allMeetings,
      answer,
      searchQuery: searchTerms,
    } as SearchResult);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search?q=query
 * Simple search endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const meetingId = searchParams.get("meeting_id");

    if (meetingId) {
      const meeting = await getMeetingById(parseInt(meetingId, 10), userId);
      if (!meeting) {
        return NextResponse.json(
          { error: "Meeting not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ meeting });
    }

    if (!query) {
      // Return recent meetings for this user
      const summary = await getAllMeetingsSummary(userId, 20);
      return NextResponse.json({ meetings: summary });
    }

    // Simple keyword search (scoped to user)
    let meetings = await searchMeetings(query, userId, 10);
    if (meetings.length === 0) {
      meetings = await searchMeetingsSimple(query, userId, 10);
    }

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

/**
 * Extract search terms from natural language query using Claude
 */
async function extractSearchTerms(query: string, userId: string): Promise<string> {
  try {
    const basePrompt = await resolvePrompt(PROMPT_SEARCH_OPTIMIZER, userId);
    const prompt = `${basePrompt}

Question: ${query}`;

    return (await chatCompletion(prompt, { maxTokens: 100 })) || query;
  } catch (error) {
    console.error("Error extracting search terms:", error);
    // Fallback to original query if LLM fails
    return query;
  }
}

/**
 * Generate a natural language answer based on the query and meeting data
 */
async function generateAnswer(
  query: string,
  meetings: WebhookKeyPointsRow[],
  userId: string
): Promise<string> {
  try {
    // Prepare meeting context for the LLM
    const meetingContext = meetings.map((m, i) => {
      const keyPoints = Array.isArray(m.content)
        ? m.content.map((kp) => ("description" in kp ? kp.description : kp.text) || "").filter(Boolean).join("\n- ")
        : "";
      return `
Meeting ${i + 1}: "${m.meeting_title || "Untitled"}"
Date: ${m.meeting_start_date ? new Date(m.meeting_start_date).toLocaleDateString() : "Unknown"}
Speakers: ${Array.isArray(m.speakers) ? m.speakers.map((s: unknown) => typeof s === "string" ? s : ((s as Record<string, string>).first_name || "") + " " + ((s as Record<string, string>).last_name || "")).map((n: string) => n.trim() || "Unknown Speaker").join(", ") : "Unknown"}
Key Points:
- ${keyPoints}
Transcript excerpt: ${m.raw_content?.slice(0, 1000) || "No transcript available"}
---`;
    }).join("\n");

    const basePrompt = await resolvePrompt(PROMPT_SEARCH_ANSWER, userId);
    const prompt = `${basePrompt}

Based on the following meeting data, answer this question: "${query}"

Meeting Data:
${meetingContext}`;

    return (await chatCompletion(prompt, { maxTokens: 500 })) || "I couldn't generate an answer.";
  } catch (error) {
    console.error("Error generating answer:", error);
    return `Found ${meetings.length} relevant meeting(s). Unable to generate AI summary at this time.`;
  }
}
