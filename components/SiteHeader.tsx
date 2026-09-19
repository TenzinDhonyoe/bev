import Link from "next/link";
import { BevMark } from "./BevMark";
import { HeaderShell } from "./HeaderShell";
import { NavLinks } from "./NavLinks";

export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Bev, home">
          <BevMark size={30} className="transition-transform duration-500 group-hover:rotate-180 motion-reduce:transition-none" />
          <span className="font-display text-xl font-bold tracking-tight">Bev</span>
          <span className="hidden rounded-full border border-ink/25 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-soft sm:inline">
            System Three
          </span>
        </Link>
        <NavLinks />
      </div>
    </HeaderShell>
  );
}
