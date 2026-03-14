"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How does the desktop recorder work?",
    answer:
      "Install the lightweight MyOpenBrain app on your Windows PC. It runs silently in the background and automatically records and transcribes every call \u2014 Zoom, Teams, Meet, Slack, and even in-person conversations. No bots join your meeting, and no one knows it\u2019s running.",
  },
  {
    question: "How does it handle my emails?",
    answer:
      "Connect your Gmail or Outlook account and MyOpenBrain automatically classifies incoming emails with smart labels, extracts action items, and makes your entire email history searchable with natural language queries. It works alongside your existing inbox \u2014 nothing changes about how you send and receive email.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). We never use your data to train AI models. Row-level security ensures only you can access your data, even at the database level. You can export or delete everything at any time.",
  },
  {
    question: "What does the 14-day trial include?",
    answer:
      "You get full access to the Second Brain plan \u2014 unlimited captures, Brain Chat, Decision Register, email management, weekly briefings, and everything else. No credit card required. If you don\u2019t save at least 3 hours in your first week, cancel instantly with no questions asked.",
  },
  {
    question: "What\u2019s the \u201c3 Hours Back\u201d Guarantee?",
    answer:
      "We\u2019re so confident MyOpenBrain saves you time that we guarantee it. If you don\u2019t save at least 3 hours in your first week of use, cancel anytime \u2014 no questions asked, no hoops to jump through. Our average user saves 3+ hours per week on email and meeting overhead.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Two plans: Focus at $19/mo ($149/yr) for email + meetings basics, and Second Brain at $39/mo ($349/yr) for the full intelligence system including Brain Chat, Decision Register, and AI briefings. Both include a 14-day free trial with full access. Founder\u2019s Pricing locks in your rate for life.",
  },
  {
    question: "How is this different from SaneBox / Fyxer / Superhuman?",
    answer:
      "Those tools do one thing well and charge $25\u201350/mo for it. MyOpenBrain unifies six tools in one \u2014 meeting recorder, email manager, AI search, decision tracker, task board, and weekly briefings \u2014 for $39/mo. Your meeting transcript connects to the email thread, the decisions made, and the action items that followed. No other tool gives you that cross-source context.",
  },
  {
    question: "What is Founder\u2019s Pricing?",
    answer:
      "Early adopters lock in current pricing for life, even as we add features and raise prices. Once you subscribe at today\u2019s rate, your price never goes up \u2014 as long as your subscription stays active.",
  },
  {
    question: "How accurate is the AI?",
    answer:
      "Our AI uses state-of-the-art models for transcription and extraction. Every AI-generated insight includes source attribution so you can verify it against the original call or email.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most users are up and running in under 5 minutes. Install the desktop app, connect your email, and MyOpenBrain starts working immediately.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes. Your data is yours. Export anytime in standard formats.",
  },
  {
    question: "Does my whole team need to use it?",
    answer:
      "No. MyOpenBrain works for individuals. It captures what comes through your machine and your inbox \u2014 no team-wide rollout needed.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">
          Frequently asked questions
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div
              key={faq.question}
              className="rounded-lg border border-slate-800 bg-slate-900/50"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-white font-medium pr-4">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-slate-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
