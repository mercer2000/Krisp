import { NavHeader } from "../components/NavHeader";
import { Footer } from "../components/Footer";
import { PricingClient } from "./PricingClient";

export const metadata = {
  title: "Pricing — MyOpenBrain",
  description: "Simple, transparent pricing for individuals and teams.",
};

export default function PricingPage() {
  return (
    <>
      <NavHeader />
      <main className="pt-24 pb-16">
        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
              No hidden fees. No surprises. Pick the plan that fits your workflow.
            </p>
            <PricingClient />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
