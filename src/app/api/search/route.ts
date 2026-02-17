import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  searchMeetings,
  searchMeetingsSimple,
  getAllMeetingsSummary,
  getMeetingById,
} from "@/lib/webhookKeyPoints";
import type { WebhookKeyPointsRow } from "@/types/webhook";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface SearchResult {
  meetings: WebhookKeyPointsRow[];
  answer: string;
  searchQuery: string;
}

/**
 * POST /api/search
 * Natural language search across meeting transcripts using LLM
 */
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Step 1: Use LLM to extract search terms from natural language query
    const searchTerms = await extractSearchTerms(query);

    // Step 2: Search the database for relevant meetings
    let meetings = await searchMeetings(searchTerms, 10);

    // Fallback to simple search if full-text search returns no results
    if (meetings.length === 0) {
      meetings = await searchMeetingsSimple(searchTerms, 10);
    }

    // Also try searching with individual words if still no results
    if (meetings.length === 0) {
      const words = searchTerms.split(/\s+/).filter(w => w.length > 2);
      for (const word of words) {
        const wordResults = await searchMeetingsSimple(word, 10);
        if (wordResults.length > 0) {
          meetings = wordResults;
          break;
        }
      }
    }

    // Step 3: Always fetch recent meetings so the LLM has context for
    // temporal queries like "last meeting" or "most recent 1:1"
    const { getRecentWebhookKeyPoints } = await import("@/lib/webhookKeyPoints");
    const recentMeetings = await getRecentWebhookKeyPoints(5);

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
    const answer = await generateAnswer(query, allMeetings);

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
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const meetingId = searchParams.get("meeting_id");

    if (meetingId) {
      const meeting = await getMeetingById(parseInt(meetingId, 10));
      if (!meeting) {
        return NextResponse.json(
          { error: "Meeting not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ meeting });
    }

    if (!query) {
      // Return recent meetings
      const summary = await getAllMeetingsSummary(20);
      return NextResponse.json({ meetings: summary });
    }

    // Simple keyword search
    let meetings = await searchMeetings(query, 10);
    if (meetings.length === 0) {
      meetings = await searchMeetingsSimple(query, 10);
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
async function extractSearchTerms(query: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `You are a search query optimizer. Extract the key search terms from this question about meeting transcripts.
Return only the essential keywords that would be useful for searching meeting transcripts.
Do not include common words like "meeting", "transcript", "find", "search", etc.
Return just the search terms, nothing else.

Question: ${query}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock?.text?.trim() || query;
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
  meetings: WebhookKeyPointsRow[]
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

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are a helpful assistant that answers questions about meeting transcripts.
You have access to meeting data including titles, dates, speakers, key points, and transcripts.
Provide concise, helpful answers based on the meeting data provided.
If you can't find the answer in the provided data, say so clearly.
When referencing meetings, mention the meeting title and date.

Based on the following meeting data, answer this question: "${query}"

Meeting Data:
${meetingContext}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock?.text?.trim() || "I couldn't generate an answer.";
  } catch (error) {
    console.error("Error generating answer:", error);
    return `Found ${meetings.length} relevant meeting(s). Unable to generate AI summary at this time.`;
  }
}
