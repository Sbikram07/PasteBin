import React from "react";

export default function PasteEditor({ value, onChange }) {
  const lineCount = value ? value.split("\n").length : 1;
  const lines = Array.from({ length: Math.max(lineCount, 20) }, (_, i) => i + 1);

  return (
    <div className="card overflow-hidden flex">
      <div
        aria-hidden="true"
        className="select-none text-right text-slate-600 text-sm leading-6 py-3 px-3 bg-ink-950/60 border-r border-ink-700"
        style={{ minWidth: "3rem" }}
      >
        {lines.map((n) => (
          <div key={n}>{n}</div>
        ))}
      </div>
      <textarea
        className="flex-1 bg-transparent text-slate-200 text-sm leading-6 py-3 px-3 resize-y
          min-h-[420px] focus:outline-none font-mono placeholder:text-slate-600"
        placeholder="Paste your code or text here…"
        spellCheck="false"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
