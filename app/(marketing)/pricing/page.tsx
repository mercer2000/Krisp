import { NavHeader } from "../components/NavHeader";
import { Footer } from "../components/Footer";
import { PricingClient } from "./PricingClient";

export const metadata = {
  title: "Pricing — MyOpenBrain",
  description: "6 tools in one — meeting recorder, email manager, AI search, decision tracker, task board, and weekly briefings. Starting at $19/mo with a 14-day free trial.",
};

export default function PricingPage() {
  return (
    <>
      <NavHeader />
      <main className="pt-24 pb-16">
        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              6 tools in one. One simple price.
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
              Everything you need to capture, organize, and search your work — for less than competitors charge for a single tool. 14-day free trial on every plan.
            </p>
            <PricingClient />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
