"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  ClipboardList,
  Flag,
  LayoutDashboard,
  Mail,
  MessagesSquare,
  Search,
  SquarePlus,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; badge?: number };

const ICONS: Record<string, LucideIcon> = {
  "/resident/jobs": ClipboardList,
  "/resident/jobs/new": SquarePlus,
  "/messages": MessagesSquare,
  "/student/jobs": Search,
  "/student/my-jobs": Briefcase,
  "/student/profile": UserRound,
  "/account": UserRound,
  "/admin": LayoutDashboard,
  "/admin/jobs": ClipboardList,
  "/admin/users": Users,
  "/admin/reports": Flag,
  "/admin/outbox": Mail,
};

// The most specific matching link wins, so "/resident/jobs/new" doesn't also light up "/resident/jobs".
function useActive(items: NavItem[]): string | undefined {
  const pathname = usePathname();
  return items
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

/** Navigation links in the top bar (tablet and up). */
export function NavLinks({ items }: { items: NavItem[] }) {
  const active = useActive(items);
  return (
    <>
      {items.map((item) => {
        const on = item.href === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={`relative hidden h-9 items-center gap-2 rounded-md px-3.5 text-[15px] transition-colors sm:inline-flex ${
              on ? "bg-tint text-ink" : "text-ink hover:text-blue"
            }`}
          >
            {item.label}
            {item.badge ? (
              <span
                className="num flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] bg-deep px-1 text-[11px] text-white"
                data-testid="unread"
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </>
  );
}

/** A floating glass tab bar along the bottom of the screen on phones. */
export function MobileTabs({ items }: { items: NavItem[] }) {
  const active = useActive(items);
  return (
    <nav aria-label="Main" className="fixed inset-x-3 bottom-3 z-40 sm:hidden">
      <div className="glass-nav grid rounded-2xl p-1.5" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const on = item.href === active;
          const Icon = ICONS[item.href] ?? ClipboardList;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={on ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] transition-colors ${
                on ? "bg-deep text-white" : "text-muted"
              }`}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="max-w-full truncate px-1">{item.label}</span>
              {item.badge ? <span className="absolute right-[22%] top-1.5 h-2 w-2 rounded-[2px] bg-blue ring-2 ring-white" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
