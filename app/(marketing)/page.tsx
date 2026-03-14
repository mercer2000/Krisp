import { NavHeader } from "./components/NavHeader";
import { Hero } from "./components/Hero";
import { ValueStats } from "./components/ValueStats";
import { ProblemTriptych } from "./components/ProblemTriptych";
import { SolutionOverview } from "./components/SolutionOverview";
import { FeatureDeepDive } from "./components/FeatureDeepDive";
import { SocialProof } from "./components/SocialProof";
import { OfferStack } from "./components/OfferStack";
import { HowItWorks } from "./components/HowItWorks";
import { Integrations } from "./components/Integrations";
import { FAQ } from "./components/FAQ";
import { SecurityTrust } from "./components/SecurityTrust";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";

export const metadata = {
  title: "MyOpenBrain — 6 tools in one. Your second brain for work.",
  description:
    "Meeting recorder, email manager, AI search, decision tracker, task board, and weekly briefings — all for less than competitors charge for one. Save 3+ hours per week. 14-day free trial.",
};

export default function LandingPage() {
  return (
    <>
      <NavHeader />
      <main>
        <Hero />
        <ValueStats />
        <ProblemTriptych />
        <SolutionOverview />

        {/* Feature Deep-Dives */}
        <section className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
          <div className="mx-auto max-w-6xl space-y-24 sm:space-y-32">
            <FeatureDeepDive
              headline="Every call recorded and transcribed automatically"
              body="A lightweight desktop recorder captures every call on your Windows PC — Zoom, Teams, Meet, Slack, even in-person. No bots join your meeting. No one knows it's running."
              bullets={[
                "Silent local recording — no meeting bots",
                "Works with every call platform",
                "Key points and action items extracted by AI",
              ]}
              screenshotLabel="Desktop Recorder"
            />
            <FeatureDeepDive
              headline="Your inbox, sorted and searchable"
              body="AI classifies every email with smart labels, surfaces what matters, and filters out the noise. Search across your entire email history with natural language."
              bullets={[
                "Auto-categorized with smart labels",
                "Action items extracted from emails",
                "Natural language search across all messages",
              ]}
              screenshotLabel="Email Management"
              reverse
            />
            <FeatureDeepDive
              headline="Ask anything across all your data"
              body="Natural language search across meetings, emails, decisions, and tasks. Get sourced answers with context, not just keyword matches."
              bullets={[
                "Conversational interface",
                "Source attribution on every answer",
                "Suggested prompts to get started",
              ]}
              screenshotLabel="Brain Chat"
            />
            <FeatureDeepDive
              headline="Track what was decided, when, and why"
              body="Decisions are captured from meetings and emails with rationale, participants, and confidence. Never ask 'what did we decide?' again."
              bullets={[
                "Auto-extracted from meetings and emails",
                "Status tracking",
                "Full context and rationale",
              ]}
              screenshotLabel="Decision Register"
              reverse
            />
            <FeatureDeepDive
              headline="Action items flow to your board"
              body="Tasks mentioned in calls and emails flow directly to your Kanban board with due dates. No more sticky notes, no more forgotten follow-ups."
              bullets={[
                "Auto-extracted from calls and emails",
                "Kanban board with drag-and-drop",
                "Weekly AI briefings on open items",
              ]}
              screenshotLabel="Task Board"
            />
            <FeatureDeepDive
              headline="AI briefings delivered to your inbox"
              body="Every week, get a synthesis of your meetings, decisions, and open action items. Topic clusters, cross-day patterns, and unresolved items — all summarized."
              bullets={[
                "Topic clustering across sources",
                "Unresolved action item alerts",
                "Email delivery",
              ]}
              screenshotLabel="Weekly Review"
              reverse
            />
          </div>
        </section>

        <SocialProof />
        <OfferStack />
        <HowItWorks />
        <Integrations />
        <FAQ />
        <SecurityTrust />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
