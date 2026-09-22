import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchMyPastes, deletePaste } from "../services/api";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async (p) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchMyPastes(p);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your pastes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  async function handleDelete(pasteId) {
    if (!window.confirm("Delete this paste permanently?")) return;
    setDeletingId(pasteId);
    try {
      await deletePaste(pasteId);
      setData((prev) => ({
        ...prev,
        pastes: prev.pastes.filter((p) => p.pasteId !== pasteId),
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete paste.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-slate-100">Your pastes</h1>
        <Link to="/" className="btn-primary">+ New paste</Link>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : !data?.pastes?.length ? (
        <div className="card p-10 text-center text-slate-400">
          <p className="text-3xl mb-2">📭</p>
          <p>You haven't created any pastes yet.</p>
          <Link to="/" className="text-amber-soft hover:underline text-sm">Create your first one →</Link>
        </div>
      ) : (
        <div className="card divide-y divide-ink-700 overflow-hidden">
          {data.pastes.map((p) => (
            <div key={p.pasteId} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-ink-800/50">
              <div className="min-w-0">
                <Link to={`/p/${p.pasteId}`} className="text-slate-100 font-medium hover:text-amber-soft truncate block">
                  {p.title}
                </Link>
                <p className="text-xs text-slate-500 mt-0.5 space-x-2">
                  <span>{p.language}</span>
                  <span>·</span>
                  <span>{p.views} views</span>
                  <span>·</span>
                  <span>created {formatDate(p.createdAt)}</span>
                  {p.expiresAt && (
                    <>
                      <span>·</span>
                      <span>expires {formatDate(p.expiresAt)}</span>
                    </>
                  )}
                  {p.isProtected && <span>🔒</span>}
                  {p.burnAfterReading && <span>🔥</span>}
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.pasteId)}
                className="btn-danger !px-3 !py-1.5 shrink-0"
                disabled={deletingId === p.pasteId}
              >
                {deletingId === p.pasteId ? "…" : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}

      {data?.pagination?.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={n === page ? "btn-primary !px-3 !py-1.5" : "btn-secondary !px-3 !py-1.5"}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
