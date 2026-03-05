"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How does it capture my meetings?",
    answer:
      "SecondNoggin integrates with Krisp and Zoom. Meetings are automatically transcribed, and AI extracts key points, decisions, and action items.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Your data is encrypted at rest and in transit. We never use your data to train AI models. You can export or delete your data at any time.",
  },
  {
    question: "How accurate is the AI?",
    answer:
      "Our AI uses state-of-the-art models for transcription and extraction. Every AI-generated insight includes source attribution so you can verify.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most users are up and running in under 10 minutes. Connect your calendar and email, and SecondNoggin starts working immediately.",
  },
  {
    question: "How is this different from Notion / Otter / Fireflies?",
    answer:
      "Those tools do one thing well. SecondNoggin unifies meetings, emails, decisions, and tasks into one searchable system with AI that works across all your data.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes. Your data is yours. Export anytime in standard formats.",
  },
  {
    question: "Does my whole team need to use it?",
    answer:
      "No. SecondNoggin works for individuals. Team features are available but not required.",
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
