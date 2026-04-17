import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import SessionCard from "../components/SessionCard";

export default function StudentDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/sessions")
      .then((res) => setSessions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pending = sessions.filter((s) => s.status === "pending");
  const upcoming = sessions.filter((s) => s.status === "accepted");
  const past = sessions.filter(
    (s) => s.status === "completed" || s.status === "rejected"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Student Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your tutoring sessions
            </p>
          </div>
          <Link
            to="/student/request"
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
          >
            + Request Session
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading…</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No sessions yet.</p>
            <p className="text-gray-400 text-sm mt-1">
              Request your first session to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {pending.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">
                  Pending Requests ({pending.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {pending.map((s) => (
                    <SessionCard key={s.id} session={s} role="student" />
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
                    <SessionCard key={s.id} session={s} role="student" />
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
                    <SessionCard key={s.id} session={s} role="student" />
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
