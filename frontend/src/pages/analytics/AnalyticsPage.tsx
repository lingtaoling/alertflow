import { useState } from "react";
import { aiApi } from "../../services/ai.service";
import { useAuth } from "../../hooks/useAuth";

const MIN_QUERY_CHARS = 10;
const SHORT_QUERY_MESSAGE =
  "More words are needed for an accurate analysis. Please enter at least 10 characters.";
const ONLY_ALERT_ANALYTICS_MESSAGE =
  "Only alert analytics questions are allowed.";

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuth();
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState("");
  const [error, setError] = useState("");

  async function handleAiAssistant() {
    setError("");
    setAiAnswer("");
    if (!isAuthenticated) {
      setError("You must be signed in to use AI Assistant.");
      return;
    }
    const draft = aiQuery.trim();
    if (draft.length < MIN_QUERY_CHARS) {
      setError(SHORT_QUERY_MESSAGE);
      return;
    }
    setAiLoading(true);
    try {
      const result = await aiApi.analyticsQuery(draft);
      if (!result.alertAnalytics) {
        setError(ONLY_ALERT_ANALYTICS_MESSAGE);
        return;
      }
      setAiAnswer(result.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink-800 tracking-tight">
        Analytics
      </h1>

      <div className="mt-1 w-full min-w-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3 mb-1.5">
          <label className="label mb-0" htmlFor="analytics-ai-query">
            AI-powered alert analytics
          </label>
          <button
            type="button"
            disabled={aiLoading}
            className="group shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold normal-case tracking-normal
              transition-all duration-300 ease-out
              hover:scale-[1.04] hover:bg-gradient-to-r hover:from-violet-500/10 hover:via-fuchsia-500/10 hover:to-sky-500/10
              active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-1
              disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleAiAssistant}
          >
            <span className="inline-block bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-500 bg-[length:220%_auto] bg-clip-text text-transparent animate-gradient-flow drop-shadow-[0_0_10px_rgba(192,132,252,0.45)]">
              {aiLoading ? "Analyzing…" : "AI Assistant"}
            </span>
          </button>
        </div>
        <textarea
          className="input resize-none w-full min-w-0"
          id="analytics-ai-query"
          name="analyticsAiQuery"
          value={aiQuery}
          onChange={(e) => {
            setAiQuery(e.target.value);
            setError("");
          }}
          placeholder="Describe what you want to analyze…"
          rows={4}
          maxLength={4000}
          disabled={aiLoading}
          aria-busy={aiLoading}
        />
        {error && (
          <p className="mt-3 text-sm text-signal-red" role="alert">
            {error}
          </p>
        )}
        {aiAnswer && !aiLoading && (
          <div className="mt-4 rounded-lg border border-ink-200 bg-ink-50/80 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
              Answer
            </h2>
            <div className="text-ink-800 text-base whitespace-pre-wrap break-words">
              {aiAnswer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
