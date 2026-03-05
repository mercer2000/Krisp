import { NavHeader } from "./components/NavHeader";
import { Hero } from "./components/Hero";
import { ProblemTriptych } from "./components/ProblemTriptych";
import { SolutionOverview } from "./components/SolutionOverview";
import { FeatureDeepDive } from "./components/FeatureDeepDive";
import { HowItWorks } from "./components/HowItWorks";
import { Integrations } from "./components/Integrations";
import { FAQ } from "./components/FAQ";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";

export const metadata = {
  title: "SecondNoggin — Your AI second brain for work",
  description:
    "Meetings, emails, decisions, and tasks — captured by AI, searchable in seconds. Your entire work context in one place.",
};

export default function LandingPage() {
  return (
    <>
      <NavHeader />
      <main>
        <Hero />
        <ProblemTriptych />
        <SolutionOverview />

        {/* Feature Deep-Dives */}
        <section className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
          <div className="mx-auto max-w-6xl space-y-24 sm:space-y-32">
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
              headline="Every meeting becomes searchable and actionable"
              body="Key points, speakers, and action items are automatically extracted. Search across your entire meeting history with AI."
              bullets={[
                "Auto-extracted key points",
                "Speaker identification",
                "Action items flow to your board",
              ]}
              screenshotLabel="Meeting Search"
              reverse
            />
            <FeatureDeepDive
              headline="Track what was decided, when, and why"
              body="Decisions are captured from meetings and emails with rationale, participants, and confidence. Never ask 'what did we decide?' again."
              bullets={[
                "Auto-extracted from meetings",
                "Status tracking",
                "Full context and rationale",
              ]}
              screenshotLabel="Decision Register"
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

        <HowItWorks />
        <Integrations />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
