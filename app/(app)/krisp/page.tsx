"use client";

import { useState } from "react";

interface KeyPointContent {
  id: string;
  description: string;
}

interface Meeting {
  id: number;
  meeting_id: string;
  meeting_title: string | null;
  meeting_start_date: string | null;
  meeting_end_date: string | null;
  meeting_duration: number | null;
  speakers: (string | { index: number; first_name?: string; last_name?: string })[];
  participants: string[];
  content: KeyPointContent[];
  raw_content: string | null;
}

interface SearchResponse {
  meetings: Meeting[];
  answer: string;
  searchQuery: string;
}

export default function KrispPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setSelectedMeeting(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError("Failed to search. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="flex items-center px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Meeting Search
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Search across all your meeting transcripts using natural language
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about your meetings... (e.g., 'What did we discuss about the budget?')"
                className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-6 py-3 bg-[var(--primary)] hover:opacity-90 disabled:opacity-50 text-[var(--primary-foreground)] font-medium rounded-lg transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Searching...
                  </span>
                ) : (
                  "Search"
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-lg text-[var(--destructive)]">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* AI Answer */}
              <div className="p-6 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[var(--primary-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-medium text-[var(--foreground)] mb-2">AI Answer</h2>
                    <p className="text-[var(--foreground)]/80 whitespace-pre-wrap">{result.answer}</p>
                  </div>
                </div>
              </div>

              {/* Meeting Cards */}
              {result.meetings.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">
                    Related Meetings ({result.meetings.length})
                  </h2>
                  <div className="grid gap-4">
                    {result.meetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className={`p-4 bg-[var(--card)] border rounded-lg cursor-pointer transition-all ${
                          selectedMeeting?.id === meeting.id
                            ? "border-[var(--primary)] ring-2 ring-[var(--primary)]"
                            : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                        }`}
                        onClick={() => setSelectedMeeting(selectedMeeting?.id === meeting.id ? null : meeting)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-[var(--foreground)]">
                              {meeting.meeting_title || "Untitled Meeting"}
                            </h3>
                            <p className="text-sm text-[var(--muted-foreground)] mt-1">
                              {formatDate(meeting.meeting_start_date)}
                              {meeting.meeting_duration && (
                                <span className="ml-2">({formatDuration(meeting.meeting_duration)})</span>
                              )}
                            </p>
                          </div>
                          <svg
                            className={`w-5 h-5 text-[var(--muted-foreground)] transition-transform ${
                              selectedMeeting?.id === meeting.id ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        {/* Speakers */}
                        {Array.isArray(meeting.speakers) && meeting.speakers.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {meeting.speakers.map((speaker, i) => {
                              const name = typeof speaker === "string"
                                ? speaker
                                : [speaker.first_name, speaker.last_name].filter(Boolean).join(" ") || `Speaker ${speaker.index}`;
                              return (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded"
                                >
                                  {name}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Expanded Content */}
                        {selectedMeeting?.id === meeting.id && (
                          <div className="mt-4 pt-4 border-t border-[var(--border)]">
                            {/* Key Points */}
                            {Array.isArray(meeting.content) && meeting.content.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                                  Key Points
                                </h4>
                                <ul className="space-y-2">
                                  {meeting.content.map((kp, i) => (
                                    <li
                                      key={kp.id || i}
                                      className="text-sm text-[var(--muted-foreground)] flex gap-2"
                                    >
                                      <span className="text-[var(--primary)]">•</span>
                                      {kp.description}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Transcript Preview */}
                            {meeting.raw_content && (
                              <div>
                                <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                                  Transcript Preview
                                </h4>
                                <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap max-h-48 overflow-y-auto bg-[var(--secondary)] p-3 rounded">
                                  {meeting.raw_content.slice(0, 1500)}
                                  {meeting.raw_content.length > 1500 && "..."}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!result && !isLoading && (
            <div className="text-center py-16">
              <svg
                className="w-16 h-16 mx-auto text-[var(--muted-foreground)]/30 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h2 className="text-xl font-medium text-[var(--foreground)] mb-2">
                Search Your Meetings
              </h2>
              <p className="text-[var(--muted-foreground)] max-w-md mx-auto">
                Ask questions in natural language to find relevant meetings and get answers based on your transcripts.
              </p>
              <div className="mt-6 space-y-2">
                <p className="text-sm text-[var(--muted-foreground)]">Try asking:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "What was discussed in last week's standup?",
                    "Who mentioned the Q4 budget?",
                    "What are the action items from Monday?",
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(example)}
                      className="text-sm px-3 py-1.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-full hover:opacity-80 transition-opacity"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
