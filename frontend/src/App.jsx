import { useEffect, useState } from "react";
import { IngestForm } from "./components/IngestForm.jsx";
import { ItemsList } from "./components/ItemsList.jsx";
import { QueryPanel } from "./components/QueryPanel.jsx";
import { useItems } from "./hooks/useItems.js";

export default function App() {
  const { items, loading, error, load, remove } = useItems();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSuccess(result) {
    await load();
    const label = result?.type === "url" ? "URL saved" : "Note saved";
    const chunks = result?.chunkCount ?? 0;
    showToast(`${label} — ${chunks} chunk${chunks !== 1 ? "s" : ""} indexed`);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-900 leading-tight">AI Knowledge Inbox</h1>
          <p className="text-xs text-slate-400 leading-tight">Save notes &amp; URLs · Ask anything</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5">
        {/* Left column */}
        <div className="flex flex-col gap-5 min-h-0">
          <IngestForm onSuccess={handleSuccess} />
          <ItemsList items={items} loading={loading} error={error} onDelete={remove} />
        </div>

        {/* Right column — sticky query panel */}
        <div className="lg:sticky lg:top-[57px] lg:self-start">
          <QueryPanel />
        </div>
      </main>

      {/* Toast */}
      <div
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bg-slate-800 text-white text-sm px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {toast}
        </div>
      </div>
    </div>
  );
}
