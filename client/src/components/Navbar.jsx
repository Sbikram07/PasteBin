import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="border-b border-ink-700 bg-ink-950/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-display font-bold text-lg text-slate-100 flex items-center gap-1">
          <span className="text-amber">&gt;</span>
          <span className="blink-cursor">inkbin</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link to="/" className="text-slate-300 hover:text-amber-soft transition-colors">
            New paste
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-slate-300 hover:text-amber-soft transition-colors">
                Dashboard
              </Link>
              <span className="text-slate-600">|</span>
              <span className="text-slate-500 hidden sm:inline">{user.username}</span>
              <button onClick={handleLogout} className="btn-secondary !px-3 !py-1.5">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-300 hover:text-amber-soft transition-colors">
                Log in
              </Link>
              <Link to="/register" className="btn-primary !px-3 !py-1.5">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
