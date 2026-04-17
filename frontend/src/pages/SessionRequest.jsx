import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function SessionRequest() {
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/users/tutors")
      .then((res) => setTutors(res.data))
      .catch(console.error);
  }, []);

  const handleTutorSelect = (tutor) => {
    setSelectedTutor(tutor.id);
    if (tutor.subject && !subject) {
      setSubject(tutor.subject);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!selectedTutor) {
      setError("Please select a tutor.");
      return;
    }

    setSubmitting(true);
    try {
      const scheduled_at = new Date(`${date}T${time}`).toISOString();
      await api.post("/sessions", {
        tutor_id: selectedTutor,
        subject,
        scheduled_at,
        duration_minutes: duration,
        note: note || null,
      });
      navigate("/student");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to create session request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/student")}
          className="text-sm text-gray-500 hover:text-indigo-600 mb-4 inline-flex items-center gap-1 cursor-pointer"
        >
          &larr; Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Request a Session
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select a Tutor
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {tutors.map((tutor) => (
                <button
                  key={tutor.id}
                  type="button"
                  onClick={() => handleTutorSelect(tutor)}
                  className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    selectedTutor === tutor.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <p className="font-semibold text-gray-900">
                    {tutor.full_name}
                  </p>
                  {tutor.subject && (
                    <p className="text-sm text-indigo-600 mt-0.5">
                      {tutor.subject}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{tutor.email}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject / Topic
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="e.g. Calculus, Data Structures"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note for the tutor (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              placeholder="Describe what you'd like to cover…"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </form>
      </main>
    </div>
  );
}
