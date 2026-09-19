import Link from "next/link";
import { BevMark } from "./BevMark";
import { HeaderShell } from "./HeaderShell";
import { NavLinks } from "./NavLinks";

export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2" aria-label="Bev, home">
          <BevMark size={26} className="transition-transform duration-500 group-hover:rotate-180 motion-reduce:transition-none" />
          <span className="font-display text-lg font-semibold tracking-tight">Bev</span>
        </Link>
        <NavLinks />
      </div>
    </HeaderShell>
  );
}
