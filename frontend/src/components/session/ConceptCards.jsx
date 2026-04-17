import { useState } from "react";

const importanceBadge = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-700",
};

function ConceptCard({ concept, onPin, pinned }) {
  const badge = importanceBadge[concept.importance] || importanceBadge.low;

  return (
    <div
      className={`rounded-lg border p-2.5 transition-all ${
        pinned
          ? "border-indigo-300 bg-indigo-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge}`}>
              {concept.importance}
            </span>
            <h4 className="text-xs font-semibold text-gray-800 truncate">
              {concept.concept}
            </h4>
          </div>
          <p className="text-[11px] text-gray-600 leading-snug">
            {concept.explanation}
          </p>
        </div>
        <button
          onClick={() => onPin(concept)}
          className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
            pinned
              ? "bg-indigo-200 text-indigo-700"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          }`}
          title={pinned ? "Unpin" : "Pin"}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.828 3.414a2 2 0 012.828 0l1.93 1.93a2 2 0 010 2.828l-3.172 3.172a1 1 0 01-.707.293H8.5l-1.5 3.5L5.5 16.5l1.363-1.864L3 10.5v-2.207a1 1 0 01.293-.707l3.172-3.172a2 2 0 012.828 0l.535-.535z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function ConceptCards({ concepts, loading }) {
  const [pinnedSet, setPinnedSet] = useState(new Set());

  const handlePin = (concept) => {
    setPinnedSet((prev) => {
      const next = new Set(prev);
      const key = concept.concept;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const pinned = concepts.filter((c) => pinnedSet.has(c.concept));
  const unpinned = concepts.filter((c) => !pinnedSet.has(c.concept));
  const sorted = [...pinned, ...unpinned];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          Concept Cards
        </span>
        {loading && (
          <span className="text-[10px] text-indigo-500 animate-pulse font-medium">
            Analyzing…
          </span>
        )}
        {!loading && concepts.length > 0 && (
          <span className="text-[10px] text-gray-400">
            {concepts.length} concept{concepts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto px-2 py-2 space-y-2 min-h-0">
        {sorted.length === 0 && !loading ? (
          <span className="text-gray-400 text-xs px-1">
            Concepts will appear here as the session progresses…
          </span>
        ) : (
          sorted.map((c, i) => (
            <ConceptCard
              key={`${c.concept}-${i}`}
              concept={c}
              pinned={pinnedSet.has(c.concept)}
              onPin={handlePin}
            />
          ))
        )}
      </div>
    </div>
  );
}
