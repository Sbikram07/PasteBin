import React from "react";

const LANGUAGES = [
  "plaintext", "javascript", "typescript", "jsx", "python", "java", "c",
  "cpp", "csharp", "go", "rust", "php", "ruby", "sql", "bash", "json",
  "yaml", "html", "css", "markdown",
];

const EXPIRY_CHOICES = [
  { value: "never", label: "Never" },
  { value: "10m", label: "10 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "1d", label: "1 day" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

export default function PasteOptions({ options, onChange }) {
  function set(field, value) {
    onChange({ ...options, [field]: value });
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <label className="label mb-1 block">Title</label>
        <input
          type="text"
          className="input"
          placeholder="Untitled paste"
          value={options.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={120}
        />
      </div>

      <div>
        <label className="label mb-1 block">Language</label>
        <select
          className="input"
          value={options.language}
          onChange={(e) => set("language", e.target.value)}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label mb-1 block">Expiration</label>
        <select
          className="input"
          value={options.expiry}
          onChange={(e) => set("expiry", e.target.value)}
        >
          {EXPIRY_CHOICES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label mb-1 block">Password (optional)</label>
        <input
          type="password"
          className="input"
          placeholder="Leave blank for a public paste"
          value={options.password}
          onChange={(e) => set("password", e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          className="accent-amber h-4 w-4"
          checked={options.burnAfterReading}
          onChange={(e) => set("burnAfterReading", e.target.checked)}
        />
        Burn after reading (deletes after first view)
      </label>
    </div>
  );
}
