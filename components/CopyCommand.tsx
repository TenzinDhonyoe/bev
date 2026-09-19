"use client";

import { useState } from "react";

/** A terminal command with a copy button. */
export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1_800);
    } catch {
      // Clipboard can be blocked; the command is still selectable.
    }
  }

  return (
    <div className="flex max-w-full items-center gap-3 rounded-md border-2 border-ink bg-term py-2 pl-4 pr-2 font-mono text-sm text-term-text shadow-[3px_3px_0_0_var(--color-folder)]">
      <span aria-hidden="true" className="text-term-dim">
        $
      </span>
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap">{command}</code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded bg-card/10 px-2.5 py-1 text-xs font-semibold text-card hover:bg-card/20"
        aria-label={`Copy command: ${command}`}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </div>
  );
}
