import { useState } from "react";
import { queryKnowledge } from "../api.js";

export function QueryPanel() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await queryKnowledge(question);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
      <div className="px-5 pt-4 pb-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
          Ask a Question
        </h2>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about your saved content…"
              rows={3}
              required
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (question.trim()) handleSubmit(e);
                }
              }}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="absolute right-2 bottom-2 w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Ask (Enter)"
            >
              {loading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400">Press Enter to ask · Shift+Enter for new line</p>
        </form>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {error}
          </div>
        )}

        {loading && !result && <ThinkingState />}
        {result && <AnswerCard result={result} />}
      </div>
    </div>
  );
}

function ThinkingState() {
  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 flex items-center gap-3">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <span className="text-sm text-indigo-600">Searching knowledge base…</span>
    </div>
  );
}

const CONFIDENCE_META = {
  high:   { label: "High confidence",   classes: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  medium: { label: "Medium confidence", classes: "bg-amber-50  text-amber-700  border-amber-100"  },
  low:    { label: "Low confidence",    classes: "bg-orange-50 text-orange-700 border-orange-100" },
  none:   { label: "No relevant content found", classes: "bg-slate-50 text-slate-500 border-slate-200" },
};

function AnswerCard({ result }) {
  const [showSources, setShowSources] = useState(true);
  const meta = CONFIDENCE_META[result.confidence] ?? CONFIDENCE_META.low;

  // Only show sources panel if there are any
  const citedSources = result.sources?.filter((s) => s.cited) ?? [];

  return (
    <div className="flex flex-col gap-3">
      {/* Confidence badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${meta.classes}`}>
        <ConfidenceIcon confidence={result.confidence} />
        {meta.label}
        {result.reasoning && (
          <span className="font-normal opacity-75 ml-1">— {result.reasoning}</span>
        )}
      </div>

      {/* Answer text */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
        <p className="text-sm text-slate-800 leading-relaxed">{result.answer}</p>
      </div>

      {/* Cited sources only */}
      {citedSources.length > 0 && (
        <div>
          <button
            onClick={() => setShowSources((s) => !s)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${showSources ? "rotate-90" : ""}`}
              fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            {citedSources.length} source{citedSources.length !== 1 ? "s" : ""}
          </button>

          {showSources && (
            <ul className="mt-2 space-y-2">
              {citedSources.map((src) => (
                <SourceCard key={src.id} src={src} index={result.sources.indexOf(src)} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ConfidenceIcon({ confidence }) {
  if (confidence === "high") {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    );
  }
  if (confidence === "none") {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

function SourceCard({ src, index }) {
  const isUrl = src.sourceType === "url";
  const pct = Math.round(src.score * 100);

  return (
    <li className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">[{index + 1}]</span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              isUrl ? "bg-violet-50 text-violet-600" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {src.sourceType}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 tabular-nums w-8 text-right">{pct}%</span>
        </div>
      </div>

      {isUrl && (
        <a
          href={src.source}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline block mb-1.5 truncate"
        >
          {src.source}
        </a>
      )}

      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{src.snippet}</p>
    </li>
  );
}
