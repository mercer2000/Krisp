"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SETTINGS_NAV = [
  {
    section: "General",
    items: [
      { key: "account", label: "Account", href: "/settings/account", adminOnly: false },
      { key: "billing", label: "Billing", href: "/settings/billing", adminOnly: false },
      { key: "subscriptions", label: "Subscriptions", href: "/settings/subscriptions", adminOnly: true },
    ],
  },
  {
    section: "AI & Automation",
    items: [
      { key: "prompts", label: "AI Prompts", href: "/settings/prompts", adminOnly: false },
      { key: "smart-labels", label: "Smart Labels", href: "/settings/smart-labels", adminOnly: false },
    ],
  },
  {
    section: "Connections",
    items: [
      { key: "integrations", label: "Integrations", href: "/settings/integrations", adminOnly: false },
      { key: "extensions", label: "Extensions", href: "/settings/extensions", adminOnly: false },
    ],
  },
  {
    section: "Content",
    items: [
      { key: "pages", label: "Pages", href: "/settings/pages", adminOnly: false },
    ],
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.role === "admin") setIsAdmin(true); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-full">
      {/* Settings sidebar */}
      <aside className="w-[220px] shrink-0 border-r border-[var(--border)] bg-[var(--card)]">
        <div className="sticky top-0 flex flex-col gap-1 p-4">
          <h2 className="mb-3 text-lg font-bold text-[var(--foreground)]">
            Settings
          </h2>
          {SETTINGS_NAV.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.adminOnly || isAdmin
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.section} className="mb-3">
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {section.section}
                </p>
                {visibleItems.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Settings content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
