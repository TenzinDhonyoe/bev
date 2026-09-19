import { isMockMode } from "@/lib/jev";

/** Dev only: a small reminder that answers come from the keyword mock, not Jev. */
export function MockBadge() {
  if (process.env.NODE_ENV !== "development" || !isMockMode()) return null;
  return (
    <div className="fixed bottom-3 right-3 z-40 rounded border border-ink/20 bg-sticky px-2 py-1 font-mono text-xs text-ink shadow" title="No Jev key set. Answers come from a keyword heuristic.">
      mock mode
    </div>
  );
}
