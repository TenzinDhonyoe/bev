"use client";

import { useTodaysPersona } from "./useTodaysPersona";

export function FridayBanner() {
  // Server render never shows it; the client decides from the viewer's local day.
  if (useTodaysPersona() !== "gary") return null;
  return (
    <div role="status" className="sticky-note px-4 py-2 text-center text-sm font-medium text-ink">
      Bev is out of office Fridays. Her backup, Gary, is covering.
    </div>
  );
}
