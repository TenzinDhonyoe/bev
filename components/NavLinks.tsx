"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/demo", label: "Jev vs Bev" },
  { href: "/docs", label: "Docs" },
  { href: "/faq", label: "FAQ" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
      <ul className="flex items-center gap-0.5 text-sm sm:gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-2.5 py-1.5 font-medium transition-colors ${
                  active ? "bg-ink/[0.07] text-ink" : "text-ink-soft hover:bg-ink/[0.05] hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/#demo"
        className="ml-1 hidden rounded-md bg-ink px-3.5 py-1.5 text-sm font-semibold text-card shadow-[2px_2px_0_0_var(--color-folder)] hover:bg-ink-soft sm:inline-block"
      >
        Try Bev
      </Link>
    </nav>
  );
}
