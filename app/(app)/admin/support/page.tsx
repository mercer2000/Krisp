import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import Link from "next/link";
import {
  BookOpen,
  Settings,
  MessageSquare,
  Headphones,
  Ticket,
  ArrowRight,
} from "lucide-react";

const cards = [
  {
    title: "Knowledge Base",
    description:
      "Ingest URLs, text, PDFs, and sitemaps to train your support agent.",
    href: "/admin/support/knowledge-base",
    icon: BookOpen,
  },
  {
    title: "Widget Config",
    description:
      "Customize the chat widget appearance, behavior, and embed code.",
    href: "/admin/support/config",
    icon: Settings,
  },
  {
    title: "Conversations",
    description:
      "Browse chat sessions and review messages between users and the agent.",
    href: "/admin/support/conversations",
    icon: MessageSquare,
  },
  {
    title: "Live Support",
    description:
      "Monitor chat queue, claim conversations, and respond to users in real time.",
    href: "/admin/support/live",
    icon: Headphones,
  },
  {
    title: "Tickets",
    description:
      "View and manage support tickets created when no agents were available.",
    href: "/admin/support/tickets",
    icon: Ticket,
  },
];

export default async function SupportAdminPage() {
  await getRequiredAdmin();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-[var(--foreground)]">
        Support Chat
      </h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">
        Manage your AI support chat widget, knowledge base, and conversations.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10">
                <Icon className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">
                {card.title}
              </h2>
              <p className="mb-4 text-xs text-[var(--muted-foreground)]">
                {card.description}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 group-hover:gap-2 transition-all">
                Manage <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
