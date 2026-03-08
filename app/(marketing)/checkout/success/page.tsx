import Link from "next/link";
import { NavHeader } from "../../components/NavHeader";

export const metadata = {
  title: "Subscription activated — MyOpenBrain",
};

export default function CheckoutSuccessPage() {
  return (
    <>
      <NavHeader />
      <main className="pt-24 pb-16 px-6">
        <div className="mx-auto max-w-lg text-center py-24">
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            You&apos;re all set!
          </h1>
          <p className="text-slate-400 mb-8">
            Your subscription is active. Your account has been upgraded and you
            now have access to all your plan&apos;s features.
          </p>
          <Link
            href="/boards"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Go to your dashboard
          </Link>
        </div>
      </main>
    </>
  );
}
