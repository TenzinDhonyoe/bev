"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/demo", label: "Race" },
  { href: "/docs", label: "Docs" },
  { href: "/faq", label: "FAQ" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main">
      <ul className="flex items-center gap-1 text-sm">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded px-2.5 py-1.5 ${active ? "text-ink underline decoration-ink/40 underline-offset-[6px]" : "text-ink-soft hover:text-ink"}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <a href="https://github.com/TenzinDhonyoe/bev" className="rounded px-2.5 py-1.5 text-ink-soft hover:text-ink">
            GitHub
          </a>
        </li>
      </ul>
    </nav>
  );
}
