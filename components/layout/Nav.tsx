"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Story" },
  { href: "/timeline", label: "Timeline" },
  { href: "/flow", label: "Flow Map" },
  { href: "/nil", label: "NIL Money" },
  { href: "/players", label: "Players" },
  { href: "/methodology", label: "Methodology" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <nav className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-3 sm:px-6">
        <Link href="/" className="mr-4 flex items-center gap-2 shrink-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
            <Activity className="h-4 w-4" aria-hidden />
          </span>
          <span className="hidden text-sm font-semibold tracking-tight text-text-primary sm:inline">
            NIL &amp; Transfer Portal
          </span>
        </Link>

        <ul className="flex flex-1 items-center gap-0.5 overflow-x-auto">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-surface-2 text-accent"
                      : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
