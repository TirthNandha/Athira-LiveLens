import { useState } from "react";
import api from "../../api/axios";

export default function SessionRecap({ transcript, subject, durationMinutes }) {
  const [recap, setRecap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!transcript || transcript.trim().length < 20) {
      setError("Not enough transcript to generate a recap. Keep the session going!");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/ai/recap", {
        full_transcript: transcript,
        subject: subject || "",
        duration_minutes: durationMinutes || 60,
      });
      setRecap(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate recap");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Session Recap</h2>
          {recap && (
            <span className="text-xs text-gray-400">AI-generated summary</span>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {!recap && !loading && !error && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                Generate an AI-powered summary of your tutoring session.
              </p>
              <button
                onClick={handleGenerate}
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Generate Recap
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Analyzing session transcript…</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
              <button
                onClick={handleGenerate}
                className="block mt-2 text-xs underline hover:no-underline cursor-pointer"
              >
                Try again
              </button>
            </div>
          )}

          {recap && (
            <>
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
                  {recap.summary}
                </p>
              </section>

              {recap.key_concepts?.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Key Concepts ({recap.key_concepts.length})
                  </h3>
                  <div className="space-y-2">
                    {recap.key_concepts.map((c, i) => (
                      <div key={i} className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-indigo-700">{c.concept}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{c.explanation}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {recap.areas_of_difficulty?.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Areas of Difficulty
                  </h3>
                  <ul className="space-y-1">
                    {recap.areas_of_difficulty.map((a, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">●</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {recap.practice_questions?.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Practice Questions
                  </h3>
                  <ol className="space-y-2">
                    {recap.practice_questions.map((q, i) => (
                      <li key={i} className="text-xs text-gray-600 bg-green-50 border border-green-100 rounded-lg p-3">
                        <span className="font-semibold text-green-700 mr-1">
                          Q{i + 1}.
                        </span>
                        {q}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
