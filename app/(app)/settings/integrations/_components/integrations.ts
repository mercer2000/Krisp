export type IntegrationSlug =
  | "gmail"
  | "outlook"
  | "graph"
  | "microsoft365"
  | "google-calendar"
  | "zoom"
  | "telegram"
  | "zapier"
  | "outbound-webhooks"
  | "krisp";

export type IntegrationCategory = "email" | "calendar" | "chat" | "webhooks";

export interface IntegrationDef {
  slug: IntegrationSlug;
  name: string;
  description: string;
  category: IntegrationCategory;
  color: string;
}

export const CATEGORIES: { id: IntegrationCategory; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "calendar", label: "Calendar" },
  { id: "chat", label: "Chat" },
  { id: "webhooks", label: "Webhooks" },
];

export const INTEGRATIONS: IntegrationDef[] = [
  {
    slug: "gmail",
    name: "Gmail",
    description: "Push notifications for new emails",
    category: "email",
    color: "#EA4335",
  },
  {
    slug: "outlook",
    name: "Outlook.com",
    description: "Email and calendar sync via OAuth",
    category: "email",
    color: "#0078D4",
  },
  {
    slug: "graph",
    name: "Graph API",
    description: "Azure AD credentials for Exchange/Outlook",
    category: "email",
    color: "#0078D4",
  },
  {
    slug: "microsoft365",
    name: "Microsoft 365",
    description: "Power Automate webhook setup",
    category: "email",
    color: "#0078D4",
  },
  {
    slug: "google-calendar",
    name: "Google Calendar",
    description: "Read-only calendar event sync",
    category: "calendar",
    color: "#4285F4",
  },
  {
    slug: "zoom",
    name: "Zoom Chat",
    description: "Team Chat message sync",
    category: "chat",
    color: "#2D8CFF",
  },
  {
    slug: "telegram",
    name: "Telegram",
    description: "Chat bot for Brain AI",
    category: "chat",
    color: "#0088CC",
  },
  {
    slug: "zapier",
    name: "Zapier",
    description: "Generic webhook ingest with signing",
    category: "webhooks",
    color: "#FF4A00",
  },
  {
    slug: "outbound-webhooks",
    name: "Outbound Webhooks",
    description: "Push events to external services",
    category: "webhooks",
    color: "#10B981",
  },
  {
    slug: "krisp",
    name: "Krisp Meetings",
    description: "Key points and transcripts from meetings",
    category: "webhooks",
    color: "#4B45DC",
  },
];

export function getIntegration(
  slug: string,
): IntegrationDef | undefined {
  return INTEGRATIONS.find((i) => i.slug === slug);
}
