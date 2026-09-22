import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// Custom style overrides layered on top of vscDarkPlus so it matches
// the app's ink/amber palette instead of the default blue VS Code look.
const customStyle = {
  ...vscDarkPlus,
};

export default function PasteViewer({ content, language }) {
  return (
    <div className="card overflow-hidden">
      <SyntaxHighlighter
        language={language === "plaintext" ? "text" : language}
        style={customStyle}
        showLineNumbers
        wrapLongLines
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: "transparent",
          fontSize: "0.875rem",
          lineHeight: "1.6",
          minHeight: "200px",
        }}
        lineNumberStyle={{ color: "#3d4763", minWidth: "2.5em" }}
      >
        {content || ""}
      </SyntaxHighlighter>
    </div>
  );
}
