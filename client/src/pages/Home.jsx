import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PasteEditor from "../components/PasteEditor";
import PasteOptions from "../components/PasteOptions";
import { createPaste } from "../services/api";

const DEFAULT_OPTIONS = {
  title: "",
  language: "plaintext",
  expiry: "never",
  password: "",
  burnAfterReading: false,
};

export default function Home() {
  const [content, setContent] = useState("");
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Paste content cannot be empty.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createPaste({ content, ...options });
      const { pasteId, deleteToken } = res.data;

      if (deleteToken) {
        // Anonymous paste — stash the delete token locally so the
        // creator can delete it later from this browser.
        const stored = JSON.parse(localStorage.getItem("inkbin_delete_tokens") || "{}");
        stored[pasteId] = deleteToken;
        localStorage.setItem("inkbin_delete_tokens", JSON.stringify(stored));
      }

      navigate(`/p/${pasteId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create paste. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-slate-100">
          Share a snippet<span className="text-amber">.</span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Paste code or text, pick your options, get a link. No signup required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <PasteEditor value={content} onChange={setContent} />

        <div className="space-y-4">
          <PasteOptions options={options} onChange={setOptions} />

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Creating…" : "Create paste →"}
          </button>
        </div>
      </form>
    </div>
  );
}
