import { useState } from "react";

export function ItemsList({ items, loading, error, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-0">
      <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Saved Items</h2>
        {!loading && (
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
            {items.length}
          </span>
        )}
      </div>

      <div className="overflow-y-auto max-h-[420px]">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 mx-4 mt-3 px-3 py-2 rounded-xl border border-red-100">{error}</p>
        )}

        {loading ? (
          <ul className="divide-y divide-slate-100 px-5">
            {[1, 2, 3].map((i) => (
              <li key={i} className="py-3.5 flex gap-3 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded-full w-24" />
                  <div className="h-3 bg-slate-100 rounded-full w-full" />
                  <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                </div>
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2 text-center px-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m0 5.625c0 2.278 3.694 4.125 8.25 4.125s8.25-1.847 8.25-4.125" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 font-medium">Nothing saved yet</p>
            <p className="text-xs text-slate-400">Add a note or URL above to get started</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 px-5">
            {items.map((item) => (
              <ItemRow key={item.id} item={item} onDelete={onDelete} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ItemRow({ item, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(item.id);
    } catch (err) {
      setDeleting(false);
      alert(err.message);
    }
  }

  const isUrl = item.type === "url";

  return (
    <li className={`py-3.5 flex items-start justify-between gap-3 group transition-opacity ${deleting ? "opacity-40" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              isUrl
                ? "bg-violet-50 text-violet-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {isUrl ? (
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
            ) : (
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 18.549 2.8a1.875 1.875 0 1 1 2.651 2.651L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
              </svg>
            )}
            {item.type}
          </span>
          <span className="text-xs text-slate-400">
            {formatRelativeTime(item.created_at)}
          </span>
        </div>

        {isUrl && (
          <a
            href={item.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline truncate block mb-1"
          >
            {item.source}
          </a>
        )}

        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {item.preview}{item.preview?.length >= 300 ? "…" : ""}
        </p>
      </div>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-all"
        title="Delete"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  );
}

function formatRelativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
