/**
 * Types for meeting analytics: sentiment, talk-time, engagement
 */

export interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
  /** Overall score from -1 (very negative) to +1 (very positive) */
  overall: number;
}

export interface SpeakerTalkTime {
  speaker: string;
  /** Number of transcript segments attributed to this speaker */
  segments: number;
  /** Approximate word count for this speaker */
  wordCount: number;
  /** Percentage of total words spoken (0-100) */
  percentage: number;
}

export interface EngagementScore {
  /** 0-100 score combining multiple factors */
  score: number;
  factors: {
    participantBalance: number;
    keyPointsDensity: number;
    duration: number;
  };
}

export interface MeetingAnalytics {
  meetingId: number;
  meetingTitle: string | null;
  meetingDate: string | null;
  duration: number | null;
  sentiment: SentimentScore;
  talkTime: SpeakerTalkTime[];
  engagement: EngagementScore;
  participantCount: number;
  keyPointsCount: number;
}

export interface AnalyticsTrend {
  date: string;
  sentimentAvg: number;
  engagementAvg: number;
  meetingCount: number;
}

export interface AnalyticsSummary {
  meetings: MeetingAnalytics[];
  trends: AnalyticsTrend[];
  overallSentiment: SentimentScore;
  overallEngagement: number;
  totalMeetings: number;
  topSpeakers: { speaker: string; totalWords: number; meetingCount: number }[];
}
