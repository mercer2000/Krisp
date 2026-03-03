import sql from "./db";
import type { WebhookKeyPointsRow, Speaker } from "@/types/webhook";
import type {
  SentimentScore,
  SpeakerTalkTime,
  EngagementScore,
  MeetingAnalytics,
  AnalyticsTrend,
  AnalyticsSummary,
} from "@/types/analytics";

// ---------------------------------------------------------------------------
// Sentiment word lists (lightweight, no external dependency)
// ---------------------------------------------------------------------------

const POSITIVE_WORDS = new Set([
  "agree", "agreed", "amazing", "awesome", "beneficial", "best", "better",
  "celebrate", "clear", "collaboration", "committed", "confident", "congrats",
  "congratulations", "constructive", "creative", "delighted", "effective",
  "efficient", "encouraged", "excellent", "excited", "exciting", "fantastic",
  "forward", "glad", "good", "great", "happy", "helpful", "improve",
  "improved", "improvement", "innovative", "inspired", "love", "nice",
  "opportunity", "optimistic", "outstanding", "perfect", "pleased", "positive",
  "productive", "progress", "promising", "proud", "resolved", "smooth",
  "strong", "succeed", "success", "successful", "support", "terrific",
  "thank", "thanks", "thrilled", "tremendous", "valuable", "well", "win",
  "wonderful",
]);

const NEGATIVE_WORDS = new Set([
  "angry", "annoyed", "bad", "behind", "block", "blocked", "boring",
  "broken", "bug", "cancelled", "challenge", "challenging", "complaint",
  "complicated", "concern", "concerned", "confusing", "critical", "deadline",
  "delay", "delayed", "difficult", "disappointed", "disappointing",
  "disconnect", "disorganized", "down", "error", "fail", "failed",
  "failure", "fix", "frustrated", "frustrating", "frustration", "hard",
  "horrible", "impossible", "inadequate", "incomplete", "incorrect", "issue",
  "lacking", "late", "lost", "miss", "missed", "missing", "mistake",
  "negative", "never", "nobody", "obstacle", "off-track", "overdue",
  "overwhelmed", "painful", "poor", "problem", "regret", "reject",
  "rejected", "risk", "risky", "slow", "stuck", "terrible", "trouble",
  "unclear", "unfair", "unfortunate", "unhappy", "unresolved", "upset",
  "weak", "worry", "worried", "worse", "worst", "wrong",
]);

// ---------------------------------------------------------------------------
// Analysis helpers
// ---------------------------------------------------------------------------

function analyzeSentiment(text: string): SentimentScore {
  if (!text) return { positive: 0, negative: 0, neutral: 1, overall: 0 };

  const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
  const total = words.length || 1;
  let posCount = 0;
  let negCount = 0;

  for (const w of words) {
    if (POSITIVE_WORDS.has(w)) posCount++;
    if (NEGATIVE_WORDS.has(w)) negCount++;
  }

  const neutralCount = total - posCount - negCount;
  const overall = total > 0 ? (posCount - negCount) / Math.sqrt(total) : 0;
  const clampedOverall = Math.max(-1, Math.min(1, overall));

  return {
    positive: posCount / total,
    negative: negCount / total,
    neutral: neutralCount / total,
    overall: Math.round(clampedOverall * 100) / 100,
  };
}

function parseSpeakerName(speaker: string | Speaker): string {
  if (typeof speaker === "string") return speaker;
  const parts = [speaker.first_name, speaker.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : `Speaker ${speaker.index}`;
}

function computeTalkTime(
  rawContent: string | null,
  speakers: (string | Speaker)[]
): SpeakerTalkTime[] {
  if (!rawContent || speakers.length === 0) return [];

  const speakerNames = speakers.map(parseSpeakerName);
  // Build regex to split by speaker labels
  const escapedNames = speakerNames.map((n) =>
    n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const pattern = new RegExp(`(${escapedNames.join("|")}):\\s*`, "gi");

  const segments: { speaker: string; text: string }[] = [];
  const parts = rawContent.split(pattern);

  // parts alternates between text-before/speaker-name/text-after
  for (let i = 1; i < parts.length; i += 2) {
    const spk = parts[i];
    const txt = parts[i + 1] || "";
    // Find the matching canonical name
    const match = speakerNames.find(
      (n) => n.toLowerCase() === spk.toLowerCase()
    );
    segments.push({ speaker: match || spk, text: txt.trim() });
  }

  // Aggregate per speaker
  const map = new Map<string, { segments: number; wordCount: number }>();
  let totalWords = 0;

  for (const seg of segments) {
    const wc = seg.text.split(/\s+/).filter(Boolean).length;
    totalWords += wc;
    const existing = map.get(seg.speaker) || { segments: 0, wordCount: 0 };
    existing.segments += 1;
    existing.wordCount += wc;
    map.set(seg.speaker, existing);
  }

  // Also include speakers with no detected segments
  for (const name of speakerNames) {
    if (!map.has(name)) {
      map.set(name, { segments: 0, wordCount: 0 });
    }
  }

  const result: SpeakerTalkTime[] = [];
  for (const [speaker, data] of map) {
    result.push({
      speaker,
      segments: data.segments,
      wordCount: data.wordCount,
      percentage:
        totalWords > 0
          ? Math.round((data.wordCount / totalWords) * 1000) / 10
          : 0,
    });
  }

  return result.sort((a, b) => b.wordCount - a.wordCount);
}

function computeEngagement(
  duration: number | null,
  participantCount: number,
  keyPointsCount: number,
  talkTime: SpeakerTalkTime[]
): EngagementScore {
  // Factor 1: Participant balance (0-100)
  // Perfect balance = 100, one person dominating = lower
  let participantBalance = 50;
  if (talkTime.length > 1) {
    const percentages = talkTime.map((t) => t.percentage);
    const idealShare = 100 / talkTime.length;
    const deviation =
      percentages.reduce((sum, p) => sum + Math.abs(p - idealShare), 0) /
      talkTime.length;
    participantBalance = Math.max(0, Math.round(100 - deviation * 2));
  }

  // Factor 2: Key points density (0-100)
  // More key points per hour = more engaged discussion
  const durationHours = (duration || 1800) / 3600;
  const kpPerHour = keyPointsCount / Math.max(durationHours, 0.1);
  const keyPointsDensity = Math.min(100, Math.round(kpPerHour * 10));

  // Factor 3: Duration score (0-100)
  // 30-60 min meetings score highest, very short or very long score lower
  const durationMin = (duration || 0) / 60;
  let durationScore = 50;
  if (durationMin >= 20 && durationMin <= 75) {
    durationScore = 100;
  } else if (durationMin > 75) {
    durationScore = Math.max(20, 100 - (durationMin - 75) * 1.5);
  } else if (durationMin > 0) {
    durationScore = Math.max(20, (durationMin / 20) * 100);
  }

  const score = Math.round(
    participantBalance * 0.4 + keyPointsDensity * 0.35 + durationScore * 0.25
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    factors: {
      participantBalance,
      keyPointsDensity,
      duration: Math.round(durationScore),
    },
  };
}

// ---------------------------------------------------------------------------
// Main analytics function
// ---------------------------------------------------------------------------

function analyzeOneMeeting(row: WebhookKeyPointsRow): MeetingAnalytics {
  const rawText = row.raw_content || "";
  const sentiment = analyzeSentiment(rawText);
  const talkTime = computeTalkTime(rawText, row.speakers || []);
  const keyPointsCount = Array.isArray(row.content)
    ? row.content.filter((c) => "description" in c).length
    : 0;
  const participantCount = Math.max(
    (row.speakers || []).length,
    (row.participants || []).length
  );
  const engagement = computeEngagement(
    row.meeting_duration,
    participantCount,
    keyPointsCount,
    talkTime
  );

  return {
    meetingId: row.id,
    meetingTitle: row.meeting_title,
    meetingDate: row.meeting_start_date
      ? new Date(row.meeting_start_date).toISOString()
      : null,
    duration: row.meeting_duration,
    sentiment,
    talkTime,
    engagement,
    participantCount,
    keyPointsCount,
  };
}

export async function getMeetingAnalytics(
  userId: string,
  limit: number = 50
): Promise<AnalyticsSummary> {
  const rows = (await sql`
    SELECT * FROM webhook_key_points
    WHERE user_id = ${userId}
    ORDER BY meeting_start_date DESC
    LIMIT ${limit}
  `) as WebhookKeyPointsRow[];

  const meetings = rows.map(analyzeOneMeeting);

  // Compute trends: group by date
  const dateMap = new Map<
    string,
    { sentimentSum: number; engagementSum: number; count: number }
  >();
  for (const m of meetings) {
    const dateKey = m.meetingDate
      ? m.meetingDate.slice(0, 10)
      : "unknown";
    const existing = dateMap.get(dateKey) || {
      sentimentSum: 0,
      engagementSum: 0,
      count: 0,
    };
    existing.sentimentSum += m.sentiment.overall;
    existing.engagementSum += m.engagement.score;
    existing.count += 1;
    dateMap.set(dateKey, existing);
  }

  const trends: AnalyticsTrend[] = Array.from(dateMap.entries())
    .filter(([k]) => k !== "unknown")
    .map(([date, data]) => ({
      date,
      sentimentAvg: Math.round((data.sentimentSum / data.count) * 100) / 100,
      engagementAvg: Math.round(data.engagementSum / data.count),
      meetingCount: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Overall sentiment
  const totalMeetings = meetings.length;
  const overallSentiment: SentimentScore =
    totalMeetings > 0
      ? {
          positive:
            Math.round(
              (meetings.reduce((s, m) => s + m.sentiment.positive, 0) /
                totalMeetings) *
                100
            ) / 100,
          negative:
            Math.round(
              (meetings.reduce((s, m) => s + m.sentiment.negative, 0) /
                totalMeetings) *
                100
            ) / 100,
          neutral:
            Math.round(
              (meetings.reduce((s, m) => s + m.sentiment.neutral, 0) /
                totalMeetings) *
                100
            ) / 100,
          overall:
            Math.round(
              (meetings.reduce((s, m) => s + m.sentiment.overall, 0) /
                totalMeetings) *
                100
            ) / 100,
        }
      : { positive: 0, negative: 0, neutral: 1, overall: 0 };

  const overallEngagement =
    totalMeetings > 0
      ? Math.round(
          meetings.reduce((s, m) => s + m.engagement.score, 0) / totalMeetings
        )
      : 0;

  // Top speakers across all meetings
  const speakerMap = new Map<
    string,
    { totalWords: number; meetingCount: number }
  >();
  for (const m of meetings) {
    const seen = new Set<string>();
    for (const s of m.talkTime) {
      const existing = speakerMap.get(s.speaker) || {
        totalWords: 0,
        meetingCount: 0,
      };
      existing.totalWords += s.wordCount;
      if (!seen.has(s.speaker)) {
        existing.meetingCount += 1;
        seen.add(s.speaker);
      }
      speakerMap.set(s.speaker, existing);
    }
  }

  const topSpeakers = Array.from(speakerMap.entries())
    .map(([speaker, data]) => ({ speaker, ...data }))
    .sort((a, b) => b.totalWords - a.totalWords)
    .slice(0, 10);

  return {
    meetings,
    trends,
    overallSentiment,
    overallEngagement,
    totalMeetings,
    topSpeakers,
  };
}
