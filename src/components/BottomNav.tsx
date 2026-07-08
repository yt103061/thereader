"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "ホーム", icon: "M3 11.5 12 4l9 7.5M5.5 10v9h13v-9" },
  {
    href: "/inbox",
    label: "積読",
    icon: "M4 6h16M4 12h16M4 18h10",
  },
  {
    href: "/cards",
    label: "知識資産",
    icon: "M6 4h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm3 5h6M9 13h6",
  },
  {
    href: "/settings",
    label: "設定",
    icon: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm7.5 3.5a7.6 7.6 0 0 1-.1 1.2l2 1.5-2 3.4-2.3-.9a7.4 7.4 0 0 1-2.1 1.2l-.4 2.6h-4l-.4-2.6a7.4 7.4 0 0 1-2.1-1.2l-2.3.9-2-3.4 2-1.5a7.6 7.6 0 0 1 0-2.4l-2-1.5 2-3.4 2.3.9A7.4 7.4 0 0 1 9.6 5l.4-2.6h4l.4 2.6a7.4 7.4 0 0 1 2.1 1.2l2.3-.9 2 3.4-2 1.5c.1.4.1.8.1 1.2Z",
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-line bg-card/95 backdrop-blur">
      <div className="flex">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 pb-4 pt-2.5 text-[10px] ${
                active ? "font-bold text-ai" : "text-ink-soft"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={t.icon} />
              </svg>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
