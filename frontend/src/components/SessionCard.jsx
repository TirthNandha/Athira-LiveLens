import { Link } from "react-router-dom";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

export default function SessionCard({ session, role, onAccept, onReject }) {
  const scheduledDate = new Date(session.scheduled_at);
  const counterparty =
    role === "student" ? session.tutor_name : session.student_name;
  const counterLabel = role === "student" ? "Tutor" : "Student";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{session.subject}</h3>
          <p className="text-sm text-gray-500">
            {counterLabel}: {counterparty}
          </p>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[session.status]}`}
        >
          {session.status}
        </span>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <p>
          <span className="font-medium">Date:</span>{" "}
          {scheduledDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <p>
          <span className="font-medium">Time:</span>{" "}
          {scheduledDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p>
          <span className="font-medium">Duration:</span>{" "}
          {session.duration_minutes} min
        </p>
        {session.note && (
          <p className="mt-2 text-gray-500 italic">"{session.note}"</p>
        )}
      </div>

      {role === "tutor" && session.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onAccept(session.id)}
            className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer"
          >
            Accept
          </button>
          <button
            onClick={() => onReject(session.id)}
            className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm font-medium hover:bg-red-100 transition-colors cursor-pointer"
          >
            Reject
          </button>
        </div>
      )}

      {session.status === "accepted" && (
        <Link
          to={`/session/${session.id}`}
          className="mt-4 block text-center py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Join Session
        </Link>
      )}
    </div>
  );
}
