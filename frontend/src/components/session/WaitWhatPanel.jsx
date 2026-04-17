import { useState } from "react";

export default function WaitWhatPanel({ onTrigger, response, loading, userRole }) {
  const [question, setQuestion] = useState("");

  const handleClick = () => {
    onTrigger(question.trim());
    setQuestion("");
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col">
      <div className="px-3 py-2 border-b border-gray-200">
        <span className="text-xs font-medium text-gray-500">Confusion Radar</span>
      </div>
      <div className="p-2.5 space-y-2">
        {userRole === "student" && (
          <>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What confused you? (optional)"
              className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-orange-400"
            />
            <button
              onClick={handleClick}
              disabled={loading}
              className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Thinking…
                </span>
              ) : (
                "🤔 Wait, What?"
              )}
            </button>
          </>
        )}

        {response && (
          <div className="space-y-2 mt-1">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5">
              <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide mb-1">
                Simplified Explanation
              </p>
              <p className="text-xs text-gray-700 leading-relaxed">
                {response.explanation}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1">
                Think of it like…
              </p>
              <p className="text-xs text-gray-700 leading-relaxed">
                {response.analogy}
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5">
              <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide mb-1">
                Ask your tutor
              </p>
              <p className="text-xs text-gray-700 leading-relaxed italic">
                "{response.follow_up}"
              </p>
            </div>
          </div>
        )}

        {userRole === "tutor" && !response && (
          <p className="text-xs text-gray-400 px-1">
            You'll see alerts here when your student is confused.
          </p>
        )}
      </div>
    </div>
  );
}
