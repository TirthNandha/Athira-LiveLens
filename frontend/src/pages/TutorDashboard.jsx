import { useState, useEffect } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import SessionCard from "../components/SessionCard";

export default function TutorDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = () => {
    api
      .get("/sessions")
      .then((res) => setSessions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleAction = async (sessionId, status) => {
    try {
      await api.patch(`/sessions/${sessionId}`, { status });
      fetchSessions();
    } catch (err) {
      console.error("Failed to update session:", err);
    }
  };

  const pending = sessions.filter((s) => s.status === "pending");
  const upcoming = sessions.filter((s) => s.status === "accepted");
  const past = sessions.filter(
    (s) => s.status === "completed" || s.status === "rejected"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Tutor Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and manage session requests
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading…</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No session requests yet.</p>
            <p className="text-gray-400 text-sm mt-1">
              You'll see incoming requests from students here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {pending.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-yellow-700 mb-3">
                  Incoming Requests ({pending.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {pending.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      role="tutor"
                      onAccept={(id) => handleAction(id, "accepted")}
                      onReject={(id) => handleAction(id, "rejected")}
                    />
                  ))}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">
                  Upcoming Sessions ({upcoming.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {upcoming.map((s) => (
                    <SessionCard key={s.id} session={s} role="tutor" />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">
                  Past Sessions ({past.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {past.map((s) => (
                    <SessionCard key={s.id} session={s} role="tutor" />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
