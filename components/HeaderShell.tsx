"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Sticky everywhere except the race, so a screen recording of /demo shows only the race once scrolled. */
export function HeaderShell({ children }: { children: ReactNode }) {
  const sticky = usePathname() !== "/demo";
  return (
    <header
      className={`z-30 border-b border-rule ${
        sticky ? "sticky top-0 bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75" : "relative bg-paper"
      }`}
    >
      {children}
    </header>
  );
}
