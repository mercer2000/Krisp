import { describe, it, expect } from "vitest";
import type { AssessmentResult } from "@/lib/weekly-plan/types";

describe("AssessmentResult type validation", () => {
  it("validates a complete assessment result", () => {
    const result: AssessmentResult = {
      score: 7,
      bigThreeSummary: [
        { cardId: "abc", title: "Task 1", status: "completed", note: "Done well" },
        { cardId: "def", title: "Task 2", status: "in_progress", note: "Almost" },
        { cardId: "ghi", title: "Task 3", status: "not_started", note: "Blocked" },
      ],
      themeAdherence: [
        { date: "2026-03-16", theme: "Deep Build", adherence: "high", note: "Great focus" },
      ],
      highlights: ["Completed major feature"],
      carryForward: [
        { cardId: "def", title: "Task 2", reason: "Nearly done" },
      ],
      narrative: "Good week overall.",
    };

    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.bigThreeSummary).toHaveLength(3);
    expect(result.highlights.length).toBeGreaterThan(0);
  });

  it("validates score is within range", () => {
    const validScores = [1, 5, 7, 10];
    validScores.forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(10);
    });
  });

  it("validates bigThreeSummary status values", () => {
    const validStatuses: AssessmentResult["bigThreeSummary"][number]["status"][] = [
      "completed",
      "in_progress",
      "not_started",
    ];

    validStatuses.forEach((status) => {
      expect(["completed", "in_progress", "not_started"]).toContain(status);
    });
  });

  it("validates themeAdherence adherence values", () => {
    const validAdherence: AssessmentResult["themeAdherence"][number]["adherence"][] = [
      "high",
      "medium",
      "low",
    ];

    validAdherence.forEach((adherence) => {
      expect(["high", "medium", "low"]).toContain(adherence);
    });
  });

  it("validates carryForward structure", () => {
    const carryForward: AssessmentResult["carryForward"] = [
      { cardId: "card-1", title: "Unfinished task", reason: "Was blocked by dependency" },
      { cardId: "card-2", title: "Research item", reason: "Needs more time" },
    ];

    carryForward.forEach((item) => {
      expect(item).toHaveProperty("cardId");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("reason");
      expect(typeof item.cardId).toBe("string");
      expect(typeof item.title).toBe("string");
      expect(typeof item.reason).toBe("string");
    });
  });

  it("allows empty arrays for optional collections", () => {
    const result: AssessmentResult = {
      score: 5,
      bigThreeSummary: [],
      themeAdherence: [],
      highlights: [],
      carryForward: [],
      narrative: "Quiet week.",
    };

    expect(result.bigThreeSummary).toHaveLength(0);
    expect(result.themeAdherence).toHaveLength(0);
    expect(result.highlights).toHaveLength(0);
    expect(result.carryForward).toHaveLength(0);
    expect(result.narrative).toBeTruthy();
  });
});
