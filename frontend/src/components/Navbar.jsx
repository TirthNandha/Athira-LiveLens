import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  const dashLink = user.role === "student" ? "/student" : "/tutor";

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to={dashLink} className="text-xl font-bold text-indigo-600 tracking-tight">
        Athira
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user.full_name}
          <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 capitalize">
            {user.role}
          </span>
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
