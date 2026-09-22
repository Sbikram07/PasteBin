import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PasteViewer from "../components/PasteViewer";
import { fetchPaste, fetchStats, deletePaste, rawPasteUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleString();
}

export default function Paste() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [paste, setPaste] = useState(null);
  const [stats, setStats] = useState(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (password) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchPaste(id, password);
      setPaste(res.data);
      setNeedsPassword(false);
      fetchStats(id).then((s) => setStats(s.data)).catch(() => {});
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.protected) {
        setNeedsPassword(true);
      } else if (err.response?.status === 404) {
        setError("This paste doesn't exist, has expired, or was deleted.");
      } else {
        setError("Failed to load paste.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function handleUnlock(e) {
    e.preventDefault();
    load(passwordInput);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this paste permanently?")) return;
    setDeleting(true);
    try {
      const stored = JSON.parse(localStorage.getItem("inkbin_delete_tokens") || "{}");
      const deleteToken = stored[id];
      await deletePaste(id, { deleteToken });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete paste.");
      setDeleting(false);
    }
  }

  const storedTokens = JSON.parse(localStorage.getItem("inkbin_delete_tokens") || "{}");
  const canDelete =
    (paste?.owner && user && paste.owner._id === user.id) ||
    (!paste?.owner && storedTokens[id]);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">Loading…</div>;
  }

  if (needsPassword) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20">
        <div className="card p-6 text-center space-y-4">
          <p className="text-3xl">🔒</p>
          <h2 className="font-display font-semibold text-lg text-slate-100">
            This paste is password protected
          </h2>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              autoFocus
              className="input"
              placeholder="Enter password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" className="btn-primary w-full">Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  if (error && !paste) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-3xl">🕳️</p>
        <p className="text-slate-300">{error}</p>
        <Link to="/" className="btn-primary inline-flex">Create a new paste</Link>
      </div>
    );
  }

  if (!paste) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-100">{paste.title}</h1>
          <p className="text-xs text-slate-500 mt-1 space-x-2">
            <span>{paste.language}</span>
            <span>·</span>
            <span>created {formatDate(paste.createdAt)}</span>
            {paste.owner && (
              <>
                <span>·</span>
                <span>by {paste.owner.username}</span>
              </>
            )}
            {paste.expiresAt && (
              <>
                <span>·</span>
                <span>expires {formatDate(paste.expiresAt)}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleCopyLink} className="btn-secondary">
            {copied ? "Copied ✓" : "Copy link"}
          </button>
          <a
            href={rawPasteUrl(id)}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            Raw
          </a>
          {canDelete && (
            <button onClick={handleDelete} className="btn-danger" disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
      </div>

      {paste.burned && (
        <p className="text-sm text-amber bg-amber/10 border border-amber-dim/40 rounded-md px-3 py-2 mb-4">
          🔥 This paste was set to burn after reading and has now been deleted from the server —
          the link above will no longer work.
        </p>
      )}

      <PasteViewer content={paste.content} language={paste.language} />

      {stats && (
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>{stats.views} view{stats.views === 1 ? "" : "s"}</span>
          <span>{(stats.sizeBytes / 1024).toFixed(1)} KB</span>
          {stats.isProtected && <span>🔒 password protected</span>}
          {stats.burnAfterReading && <span>🔥 burns after reading</span>}
        </div>
      )}
    </div>
  );
}
