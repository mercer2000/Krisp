import { NavHeader } from "./components/NavHeader";
import { Hero } from "./components/Hero";
import { ProblemStatement } from "./components/ProblemStatement";
import { FeatureShowcase } from "./components/FeatureShowcase";
import { HowItWorks } from "./components/HowItWorks";
import { Integrations } from "./components/Integrations";
import { SocialProof } from "./components/SocialProof";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";

export const metadata = {
  title: "Second Noggin — Your second brain for the boardroom",
  description:
    "Meetings, emails, decisions, and tasks — captured, organized, and searchable by AI. The executive second brain.",
};

export default function LandingPage() {
  return (
    <>
      <NavHeader />
      <main>
        <Hero />
        <ProblemStatement />
        <FeatureShowcase />
        <HowItWorks />
        <Integrations />
        <SocialProof />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
