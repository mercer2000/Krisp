import { describe, it, expect, vi } from "vitest";

// Mock DB and related dependencies
vi.mock("@neondatabase/serverless", () => ({
  neon: () => () => Promise.resolve([]),
}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({}));
vi.mock("@/lib/ai/client", () => ({
  chatCompletion: vi.fn().mockResolvedValue("{}"),
}));
vi.mock("@/lib/ai/resolvePrompt", () => ({
  resolvePrompt: vi.fn().mockResolvedValue(""),
}));
vi.mock("@/lib/ai/prompts", () => ({
  PROMPT_WEEKLY_PLAN: "test",
  PROMPT_DAILY_TASK_CURATOR: "test",
  PROMPT_WEEK_ASSESSMENT: "test",
}));
vi.mock("@/lib/db/encryption-helpers", () => ({
  encryptFields: (obj: Record<string, unknown>) => obj,
  decryptFields: (obj: Record<string, unknown>) => obj,
  WEEKLY_PLAN_ENCRYPTED_FIELDS: [],
  DAILY_THEME_ENCRYPTED_FIELDS: [],
  CARD_ENCRYPTED_FIELDS: [],
}));

describe("rollover module exports", () => {
  it("should export rolloverWeek as a function", async () => {
    const mod = await import("@/lib/weekly-plan/rollover");
    expect(typeof mod.rolloverWeek).toBe("function");
  });
});

describe("assess module exports", () => {
  it("should export generateAssessment as a function", async () => {
    const mod = await import("@/lib/weekly-plan/assess");
    expect(typeof mod.generateAssessment).toBe("function");
  });

  it("should export saveReflection as a function", async () => {
    const mod = await import("@/lib/weekly-plan/assess");
    expect(typeof mod.saveReflection).toBe("function");
  });
});

describe("generate module exports", () => {
  it("should export getUpcomingWeekRange as a function", async () => {
    const mod = await import("@/lib/weekly-plan/generate");
    expect(typeof mod.getUpcomingWeekRange).toBe("function");
  });

  it("should export gatherPlanData as a function", async () => {
    const mod = await import("@/lib/weekly-plan/generate");
    expect(typeof mod.gatherPlanData).toBe("function");
  });

  it("should export generatePlanSuggestions as a function", async () => {
    const mod = await import("@/lib/weekly-plan/generate");
    expect(typeof mod.generatePlanSuggestions).toBe("function");
  });

  it("should export curateTasksForDay as a function", async () => {
    const mod = await import("@/lib/weekly-plan/generate");
    expect(typeof mod.curateTasksForDay).toBe("function");
  });

  it("should export createWeeklyPlan as a function", async () => {
    const mod = await import("@/lib/weekly-plan/generate");
    expect(typeof mod.createWeeklyPlan).toBe("function");
  });

  it("should export activatePlan as a function", async () => {
    const mod = await import("@/lib/weekly-plan/generate");
    expect(typeof mod.activatePlan).toBe("function");
  });
});

describe("types module", () => {
  it("should be importable", async () => {
    const types = await import("@/lib/weekly-plan/types");
    expect(types).toBeDefined();
  });
});
