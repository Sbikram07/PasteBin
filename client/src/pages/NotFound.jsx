import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
      <p className="text-4xl font-display font-bold text-amber">404</p>
      <p className="text-slate-400">This page doesn't exist.</p>
      <Link to="/" className="btn-primary inline-flex">Go home</Link>
    </div>
  );
}
