import Link from "next/link";
import { NavHeader } from "../../components/NavHeader";

export const metadata = {
  title: "Checkout cancelled — MyOpenBrain",
};

export default function CheckoutCancelPage() {
  return (
    <>
      <NavHeader />
      <main className="pt-24 pb-16 px-6">
        <div className="mx-auto max-w-lg text-center py-24">
          <h1 className="text-3xl font-bold text-white mb-3">
            Checkout cancelled
          </h1>
          <p className="text-slate-400 mb-8">
            No worries! You haven&apos;t been charged. You can always come back
            and subscribe when you&apos;re ready.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-600 transition-colors"
          >
            Back to pricing
          </Link>
        </div>
      </main>
    </>
  );
}
