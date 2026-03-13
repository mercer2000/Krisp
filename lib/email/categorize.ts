export interface Category {
  label: string;
  color: string;
  icon: string;
}

const RULES: Array<{ pattern: RegExp; category: Category }> = [
  {
    pattern: /meeting|calendar|invite|schedule|agenda|rsvp/i,
    category: { label: "Meeting", color: "#2E5BBA", icon: "calendar" },
  },
  {
    pattern: /invoice|payment|billing|receipt|order|subscription|renew/i,
    category: { label: "Finance", color: "#C0392B", icon: "dollar" },
  },
  {
    pattern: /update|release|deploy|build|merge|pr |commit|bug|github|ci\/cd|pipeline/i,
    category: { label: "Dev", color: "#1A8A5C", icon: "code" },
  },
  {
    pattern: /report|analytics|metrics|data|dashboard|insights|weekly.*summary/i,
    category: { label: "Analytics", color: "#8E44AD", icon: "chart" },
  },
  {
    pattern: /doc|document|proposal|draft|review|spec|shared.*with/i,
    category: { label: "Document", color: "#D4721A", icon: "file" },
  },
  {
    pattern: /team|standup|sync|1:1|check-in|all-hands|retro/i,
    category: { label: "Team", color: "#16A085", icon: "people" },
  },
  {
    pattern: /newsletter|digest|weekly|roundup|curated/i,
    category: { label: "Newsletter", color: "#6C3483", icon: "newspaper" },
  },
];

const DEFAULT_CATEGORY: Category = {
  label: "Email",
  color: "#5D6D7E",
  icon: "mail",
};

export function categorize(subject: string, snippet: string): Category {
  const text = `${subject} ${snippet}`;
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return DEFAULT_CATEGORY;
}

export const ALL_CATEGORIES = [
  ...RULES.map((r) => r.category),
  DEFAULT_CATEGORY,
];
