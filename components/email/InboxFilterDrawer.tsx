"use client";

import { Drawer } from "@/components/ui/Drawer";

interface EmailAccount {
  id: string;
  email: string;
  provider: "outlook" | "gmail" | "zoom";
}

interface LabelDef {
  id: string;
  name: string;
  color: string;
  is_system: boolean;
}

interface SmartLabelDef {
  id: string;
  name: string;
  color: string;
}

interface SmartRulePageDef {
  id: string;
  name: string;
  color: string;
}

function ProviderIcon({ provider, size = 16 }: { provider: "outlook" | "gmail" | "zoom"; size?: number }) {
  if (provider === "gmail") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    );
  }
  if (provider === "zoom") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 10l5-3v10l-5-3z" />
        <rect width="13" height="10" x="1" y="7" rx="2" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

interface InboxFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  accounts: EmailAccount[];
  filterAccount: string | null;
  setFilterAccount: (v: string | null) => void;
  setFilterProvider: (v: "outlook" | "gmail" | "zoom" | null) => void;
  allLabels: LabelDef[];
  filterLabel: string | null;
  setFilterLabel: (v: string | null) => void;
  allSmartLabels: SmartLabelDef[];
  filterSmartLabel: string | null;
  setFilterSmartLabel: (v: string | null) => void;
  allSmartRulePages: SmartRulePageDef[];
  filterSmartRulePage: string | null;
  setFilterSmartRulePage: (v: string | null) => void;
  afterDate: string;
  setAfterDate: (v: string) => void;
  beforeDate: string;
  setBeforeDate: (v: string) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  hasFetchedOnce: React.MutableRefObject<boolean>;
  setPage: (v: number) => void;
}

export function InboxFilterDrawer({
  open,
  onClose,
  accounts,
  filterAccount,
  setFilterAccount,
  setFilterProvider,
  allLabels,
  filterLabel,
  setFilterLabel,
  allSmartLabels,
  filterSmartLabel,
  setFilterSmartLabel,
  allSmartRulePages,
  filterSmartRulePage,
  setFilterSmartRulePage,
  afterDate,
  setAfterDate,
  beforeDate,
  setBeforeDate,
  hasActiveFilters,
  clearFilters,
  hasFetchedOnce,
  setPage,
}: InboxFilterDrawerProps) {
  const activeFilterCount = [
    filterAccount,
    filterLabel,
    filterSmartLabel,
    filterSmartRulePage,
    afterDate,
    beforeDate,
  ].filter(Boolean).length;

  return (
    <Drawer open={open} onClose={onClose} title="Filters" width="max-w-sm">
      <div className="flex flex-col gap-6">
        {/* Account section */}
        {accounts.length > 1 && (
          <section>
            <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              Account
            </h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  hasFetchedOnce.current = false;
                  setFilterAccount(null);
                  setFilterProvider(null);
                  setPage(1);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  !filterAccount
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                    : "text-[var(--foreground)] hover:bg-[var(--accent)]"
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  !filterAccount ? "border-[var(--primary)]" : "border-[var(--border)]"
                }`}>
                  {!filterAccount && <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />}
                </span>
                All accounts
              </button>
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => {
                    hasFetchedOnce.current = false;
                    if (filterAccount === account.id) {
                      setFilterAccount(null);
                      setFilterProvider(null);
                    } else {
                      setFilterAccount(account.id);
                      setFilterProvider(account.provider);
                    }
                    setPage(1);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    filterAccount === account.id
                      ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                      : "text-[var(--foreground)] hover:bg-[var(--accent)]"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    filterAccount === account.id ? "border-[var(--primary)]" : "border-[var(--border)]"
                  }`}>
                    {filterAccount === account.id && <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />}
                  </span>
                  <ProviderIcon provider={account.provider} size={14} />
                  <span className="truncate">{account.email}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Labels section */}
        {allLabels.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              Labels
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterLabel(null)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  !filterLabel
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                }`}
              >
                All
              </button>
              {allLabels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => setFilterLabel(filterLabel === label.id ? null : label.id)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    filterLabel === label.id
                      ? "border-current font-medium"
                      : "border-transparent hover:border-current"
                  }`}
                  style={{
                    backgroundColor: filterLabel === label.id ? label.color + "22" : label.color + "11",
                    color: label.color,
                  }}
                >
                  {label.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Smart Labels section */}
        {allSmartLabels.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              Smart Labels
            </h3>
            <div className="flex flex-wrap gap-2">
              {allSmartLabels.map((sl) => (
                <button
                  key={sl.id}
                  onClick={() => setFilterSmartLabel(filterSmartLabel === sl.id ? null : sl.id)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    filterSmartLabel === sl.id
                      ? "border-current font-medium"
                      : "border-transparent hover:border-current"
                  }`}
                  style={{
                    backgroundColor: filterSmartLabel === sl.id ? sl.color + "22" : sl.color + "11",
                    color: sl.color,
                  }}
                >
                  {sl.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Smart Rules section */}
        {allSmartRulePages.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              Smart Rules
            </h3>
            <div className="flex flex-wrap gap-2">
              {allSmartRulePages.map((srp) => (
                <button
                  key={srp.id}
                  onClick={() => setFilterSmartRulePage(filterSmartRulePage === srp.id ? null : srp.id)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    filterSmartRulePage === srp.id
                      ? "border-current font-medium"
                      : "border-transparent hover:border-current"
                  }`}
                  style={{
                    backgroundColor: filterSmartRulePage === srp.id ? srp.color + "22" : srp.color + "11",
                    color: srp.color,
                  }}
                >
                  {srp.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Date Range section */}
        <section>
          <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
            Date Range
          </h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">After</label>
              <input
                type="date"
                value={afterDate}
                onChange={(e) => { hasFetchedOnce.current = false; setAfterDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Before</label>
              <input
                type="date"
                value={beforeDate}
                onChange={(e) => { hasFetchedOnce.current = false; setBeforeDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
          </div>
        </section>

        {/* Footer actions */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-[var(--border)]">
            <button
              onClick={() => {
                clearFilters();
                onClose();
              }}
              className="w-full px-4 py-2.5 text-sm font-medium text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded-lg transition-colors"
            >
              Clear all filters ({activeFilterCount})
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
