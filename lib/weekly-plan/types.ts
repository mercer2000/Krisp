export interface PlanSuggestion {
  suggestedBigThree: Array<{
    cardId: string;
    reason: string;
  }>;
  dailyThemes: Array<{
    date: string;
    theme: string;
    rationale: string;
  }>;
}

export interface TaskCuration {
  suggestedCardIds: string[];
  reasoning: string;
}

export interface AssessmentResult {
  score: number;
  bigThreeSummary: Array<{
    cardId: string;
    title: string;
    status: "completed" | "in_progress" | "not_started";
    note: string;
  }>;
  themeAdherence: Array<{
    date: string;
    theme: string;
    adherence: "high" | "medium" | "low";
    note: string;
  }>;
  highlights: string[];
  carryForward: Array<{
    cardId: string;
    title: string;
    reason: string;
  }>;
  narrative: string;
}

export interface WeekRange {
  start: Date;
  end: Date;
}
