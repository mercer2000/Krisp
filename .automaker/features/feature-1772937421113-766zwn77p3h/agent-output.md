

Let me start by reading the current state of the inbox page and the existing Drawer component to understand what I'm working with.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\Drawer.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 100,
  "limit": 200
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 300,
  "limit": 200
}
Now let me read the rendering section where the filters, folder tabs, and toolbar are rendered.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 1100,
  "limit": 400
}
Now let me find the `hasActiveFilters` and `clearFilters` definitions.

🔧 Tool: Grep
Input: {
  "pattern": "hasActiveFilters|clearFilters",
  "path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "output_mode": "content",
  "-n": true,
  "head_limit": 20
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 1030,
  "limit": 70
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 550,
  "limit": 20
}
Now let me also check what the header section looks like to understand the full layout structure.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 975,
  "limit": 40
}
Now I have a complete understanding of the layout. Let me also check if there's already an `InboxFilterDrawer` component.

🔧 Tool: Glob
Input: {
  "pattern": "components/email/InboxFilterDrawer*"
}
Good, it doesn't exist yet. Now I have a clear picture. Let me implement the plan.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create InboxFilterDrawer component with account, label, smart label, and date sections",
      "status": "in_progress",
      "activeForm": "Creating InboxFilterDrawer component"
    },
    {
      "content": "Add showMobileFilters state and wire mobile filter button to open drawer",
      "status": "pending",
      "activeForm": "Adding mobile filter drawer state and wiring"
    },
    {
      "content": "Hide inline account/label/advanced filter rows on mobile",
      "status": "pending",
      "activeForm": "Hiding inline filter rows on mobile"
    },
    {
      "content": "Add active-filter badge to mobile filter icon",
      "status": "pending",
      "activeForm": "Adding active-filter badge to mobile filter icon"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\email\\InboxFilterDrawer.tsx",
  "content": "\"use client\";\n\nimport { Drawer } from \"@/components/ui/Drawer\";\n\ninterface EmailAccount {\n  id: string;\n  email: string;\n  provider: \"outlook\" | \"gmail\" | \"zoom\";\n}\n\ninterface LabelDef {\n  id: string;\n  name: string;\n  color: string;\n  is_system: boolean;\n}\n\ninterface SmartLabelDef {\n  id: string;\n  name: string;\n  color: string;\n}\n\nfunction ProviderIcon({ provider, size = 16 }: { provider: \"outlook\" | \"gmail\" | \"zoom\"; size?: number }) {\n  if (provider === \"gmail\") {\n    return (\n      <svg xmlns=\"http://www.w3.org/2000/svg\" width={size} height={size} viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n        <path d=\"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z\" />\n        <polyline points=\"22,6 12,13 2,6\" />\n      </svg>\n    );\n  }\n  if (provider === \"zoom\") {\n    return (\n      <svg xmlns=\"http://www.w3.org/2000/svg\" width={size} height={size} viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n        <path d=\"M15 10l5-3v10l-5-3z\" />\n        <rect width=\"13\" height=\"10\" x=\"1\" y=\"7\" rx=\"2\" />\n      </svg>\n    );\n  }\n  return (\n    <svg xmlns=\"http://www.w3.org/2000/svg\" width={size} height={size} viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n      <rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\" />\n      <path d=\"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7\" />\n    </svg>\n  );\n}\n\ninterface InboxFilterDrawerProps {\n  open: boolean;\n  onClose: () => void;\n  accounts: EmailAccount[];\n  filterAccount: string | null;\n  setFilterAccount: (v: string | null) => void;\n  setFilterProvider: (v: \"outlook\" | \"gmail\" | \"zoom\" | null) => void;\n  allLabels: LabelDef[];\n  filterLabel: string | null;\n  setFilterLabel: (v: string | null) => void;\n  allSmartLabels: SmartLabelDef[];\n  filterSmartLabel: string | null;\n  setFilterSmartLabel: (v: string | null) => void;\n  afterDate: string;\n  setAfterDate: (v: string) => void;\n  beforeDate: string;\n  setBeforeDate: (v: string) => void;\n  hasActiveFilters: boolean;\n  clearFilters: () => void;\n  hasFetchedOnce: React.MutableRefObject<boolean>;\n  setPage: (v: number) => void;\n}\n\nexport function InboxFilterDrawer({\n  open,\n  onClose,\n  accounts,\n  filterAccount,\n  setFilterAccount,\n  setFilterProvider,\n  allLabels,\n  filterLabel,\n  setFilterLabel,\n  allSmartLabels,\n  filterSmartLabel,\n  setFilterSmartLabel,\n  afterDate,\n  setAfterDate,\n  beforeDate,\n  setBeforeDate,\n  hasActiveFilters,\n  clearFilters,\n  hasFetchedOnce,\n  setPage,\n}: InboxFilterDrawerProps) {\n  const activeFilterCount = [\n    filterAccount,\n    filterLabel,\n    filterSmartLabel,\n    afterDate,\n    beforeDate,\n  ].filter(Boolean).length;\n\n  return (\n    <Drawer open={open} onClose={onClose} title=\"Filters\" width=\"max-w-sm\">\n      <div className=\"flex flex-col gap-6\">\n        {/* Account section */}\n        {accounts.length > 1 && (\n          <section>\n            <h3 className=\"text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3\">\n              Account\n            </h3>\n            <div className=\"flex flex-col gap-1\">\n              <button\n                onClick={() => {\n                  hasFetchedOnce.current = false;\n                  setFilterAccount(null);\n                  setFilterProvider(null);\n                  setPage(1);\n                }}\n                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${\n                  !filterAccount\n                    ? \"bg-[var(--primary)]/10 text-[var(--primary)] font-medium\"\n                    : \"text-[var(--foreground)] hover:bg-[var(--accent)]\"\n                }`}\n              >\n                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${\n                  !filterAccount ? \"border-[var(--primary)]\" : \"border-[var(--border)]\"\n                }`}>\n                  {!filterAccount && <span className=\"w-2 h-2 rounded-full bg-[var(--primary)]\" />}\n                </span>\n                All accounts\n              </button>\n              {accounts.map((account) => (\n                <button\n                  key={account.id}\n                  onClick={() => {\n                    hasFetchedOnce.current = false;\n                    if (filterAccount === account.id) {\n                      setFilterAccount(null);\n                      setFilterProvider(null);\n                    } else {\n                      setFilterAccount(account.id);\n                      setFilterProvider(account.provider);\n                    }\n                    setPage(1);\n                  }}\n                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${\n                    filterAccount === account.id\n                      ? \"bg-[var(--primary)]/10 text-[var(--primary)] font-medium\"\n                      : \"text-[var(--foreground)] hover:bg-[var(--accent)]\"\n                  }`}\n                >\n                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${\n                    filterAccount === account.id ? \"border-[var(--primary)]\" : \"border-[var(--border)]\"\n                  }`}>\n                    {filterAccount === account.id && <span className=\"w-2 h-2 rounded-full bg-[var(--primary)]\" />}\n                  </span>\n                  <ProviderIcon provider={account.provider} size={14} />\n                  <span className=\"truncate\">{account.email}</span>\n                </button>\n              ))}\n            </div>\n          </section>\n        )}\n\n        {/* Labels section */}\n        {allLabels.length > 0 && (\n          <section>\n            <h3 className=\"text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3\">\n              Labels\n            </h3>\n            <div className=\"flex flex-wrap gap-2\">\n              <button\n                onClick={() => setFilterLabel(null)}\n                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${\n                  !filterLabel\n                    ? \"border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium\"\n                    : \"border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]\"\n                }`}\n              >\n                All\n              </button>\n              {allLabels.map((label) => (\n                <button\n                  key={label.id}\n                  onClick={() => setFilterLabel(filterLabel === label.id ? null : label.id)}\n                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${\n                    filterLabel === label.id\n                      ? \"border-current font-medium\"\n                      : \"border-transparent hover:border-current\"\n                  }`}\n                  style={{\n                    backgroundColor: filterLabel === label.id ? label.color + \"22\" : label.color + \"11\",\n                    color: label.color,\n                  }}\n                >\n                  {label.name}\n                </button>\n              ))}\n            </div>\n          </section>\n        )}\n\n        {/* Smart Labels section */}\n        {allSmartLabels.length > 0 && (\n          <section>\n            <h3 className=\"text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3\">\n              Smart Labels\n            </h3>\n            <div className=\"flex flex-wrap gap-2\">\n              {allSmartLabels.map((sl) => (\n                <button\n                  key={sl.id}\n                  onClick={() => setFilterSmartLabel(filterSmartLabel === sl.id ? null : sl.id)}\n                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${\n                    filterSmartLabel === sl.id\n                      ? \"border-current font-medium\"\n                      : \"border-transparent hover:border-current\"\n                  }`}\n                  style={{\n                    backgroundColor: filterSmartLabel === sl.id ? sl.color + \"22\" : sl.color + \"11\",\n                    color: sl.color,\n                  }}\n                >\n                  {sl.name}\n                </button>\n              ))}\n            </div>\n          </section>\n        )}\n\n        {/* Date Range section */}\n        <section>\n          <h3 className=\"text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3\">\n            Date Range\n          </h3>\n          <div className=\"flex flex-col gap-3\">\n            <div>\n              <label className=\"block text-xs text-[var(--muted-foreground)] mb-1\">After</label>\n              <input\n                type=\"date\"\n                value={afterDate}\n                onChange={(e) => { hasFetchedOnce.current = false; setAfterDate(e.target.value); setPage(1); }}\n                className=\"w-full px-3 py-2.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n              />\n            </div>\n            <div>\n              <label className=\"block text-xs text-[var(--muted-foreground)] mb-1\">Before</label>\n              <input\n                type=\"date\"\n                value={beforeDate}\n                onChange={(e) => { hasFetchedOnce.current = false; setBeforeDate(e.target.value); setPage(1); }}\n                className=\"w-full px-3 py-2.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n              />\n            </div>\n          </div>\n        </section>\n\n        {/* Footer actions */}\n        {hasActiveFilters && (\n          <div className=\"pt-2 border-t border-[var(--border)]\">\n            <button\n              onClick={() => {\n                clearFilters();\n                onClose();\n              }}\n              className=\"w-full px-4 py-2.5 text-sm font-medium text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded-lg transition-colors\"\n            >\n              Clear all filters ({activeFilterCount})\n            </button>\n          </div>\n        )}\n      </div>\n    </Drawer>\n  );\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create InboxFilterDrawer component with account, label, smart label, and date sections",
      "status": "completed",
      "activeForm": "Creating InboxFilterDrawer component"
    },
    {
      "content": "Add showMobileFilters state and wire mobile filter button to open drawer",
      "status": "in_progress",
      "activeForm": "Adding mobile filter drawer state and wiring"
    },
    {
      "content": "Hide inline account/label/advanced filter rows on mobile",
      "status": "pending",
      "activeForm": "Hiding inline filter rows on mobile"
    },
    {
      "content": "Add active-filter badge to mobile filter icon",
      "status": "pending",
      "activeForm": "Adding active-filter badge to mobile filter icon"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    }
  ]
}
Now let me add the `showMobileFilters` state and import, wire the mobile filter button, and render the drawer in `page.tsx`.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "import type { SmartLabelChip, EmailDraft } from \"@/types/smartLabel\";",
  "new_string": "import type { SmartLabelChip, EmailDraft } from \"@/types/smartLabel\";\nimport { InboxFilterDrawer } from \"@/components/email/InboxFilterDrawer\";"
}
Now add the `showMobileFilters` state variable after the existing `showFilters` state.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "  const [showFilters, setShowFilters] = useState(false);\n  const [initialLoading, setInitialLoading] = useState(true);",
  "new_string": "  const [showFilters, setShowFilters] = useState(false);\n  const [showMobileFilters, setShowMobileFilters] = useState(false);\n  const [initialLoading, setInitialLoading] = useState(true);"
}
Now wire the mobile filter button to open the drawer instead of toggling `showFilters`. Let me update the mobile filter button (the one inside `md:hidden`).

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "            <button\n              onClick={() => setShowFilters(!showFilters)}\n              className={`p-2 rounded-lg transition-colors ${\n                showFilters || hasActiveFilters\n                  ? \"text-[var(--primary)] bg-[var(--primary)]/10\"\n                  : \"text-[var(--muted-foreground)] hover:bg-[var(--accent)]\"\n              }`}\n              title=\"Filters\"\n            >\n              <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n                <polygon points=\"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3\" />\n              </svg>\n            </button>",
  "new_string": "            <div className=\"relative\">\n              <button\n                onClick={() => setShowMobileFilters(true)}\n                className={`p-2 rounded-lg transition-colors ${\n                  hasActiveFilters\n                    ? \"text-[var(--primary)] bg-[var(--primary)]/10\"\n                    : \"text-[var(--muted-foreground)] hover:bg-[var(--accent)]\"\n                }`}\n                title=\"Filters\"\n              >\n                <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n                  <polygon points=\"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3\" />\n                </svg>\n              </button>\n              {(() => {\n                const count = [filterAccount, filterLabel, filterSmartLabel, afterDate, beforeDate].filter(Boolean).length;\n                return count > 0 ? (\n                  <span className=\"absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold leading-none px-1\">\n                    {count}\n                  </span>\n                ) : null;\n              })()}\n            </div>"
}
Now I need to render the `InboxFilterDrawer` and hide the inline filter rows on mobile. Let me find the right spot to add the drawer and hide the account/label filter rows on mobile.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create InboxFilterDrawer component with account, label, smart label, and date sections",
      "status": "completed",
      "activeForm": "Creating InboxFilterDrawer component"
    },
    {
      "content": "Add showMobileFilters state and wire mobile filter button to open drawer",
      "status": "completed",
      "activeForm": "Adding mobile filter drawer state and wiring"
    },
    {
      "content": "Hide inline account/label/advanced filter rows on mobile",
      "status": "in_progress",
      "activeForm": "Hiding inline filter rows on mobile"
    },
    {
      "content": "Add active-filter badge to mobile filter icon",
      "status": "completed",
      "activeForm": "Adding active-filter badge to mobile filter icon"
    },
    {
      "content": "Render InboxFilterDrawer in the page",
      "status": "pending",
      "activeForm": "Rendering InboxFilterDrawer in the page"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    }
  ]
}
Now let me re-read the lines around the account filter chips and label filter chips to get the exact strings for the edits.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 1296,
  "limit": 10
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 1345,
  "limit": 10
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 1409,
  "limit": 10
}
Now let me read the exact account filter bar section to update it.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 1306,
  "limit": 50
}
Now I'll hide the account filter chips row on mobile by adding `hidden md:flex` to its outer div.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "        {/* Account filter chips */}\n        {accounts.length > 1 && (\n          <div className=\"px-3 md:px-6 pb-2 flex items-center gap-1.5 md:gap-2 flex-wrap\" data-testid=\"account-filter-bar\">",
  "new_string": "        {/* Account filter chips — hidden on mobile, shown in drawer instead */}\n        {accounts.length > 1 && (\n          <div className=\"px-3 md:px-6 pb-2 hidden md:flex items-center gap-1.5 md:gap-2 flex-wrap\" data-testid=\"account-filter-bar\">"
}
Now hide the label filter chips on mobile.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "        {/* Label filter chips */}\n        {(allLabels.length > 0 || allSmartLabels.length > 0) && (\n          <div className=\"px-3 md:px-6 pb-3 flex items-center gap-1.5 md:gap-2 flex-wrap\" data-testid=\"label-filter-bar\">",
  "new_string": "        {/* Label filter chips — hidden on mobile, shown in drawer instead */}\n        {(allLabels.length > 0 || allSmartLabels.length > 0) && (\n          <div className=\"px-3 md:px-6 pb-3 hidden md:flex items-center gap-1.5 md:gap-2 flex-wrap\" data-testid=\"label-filter-bar\">"
}
Now hide the advanced filter panel on mobile.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "        {/* Filter panel */}\n        {showFilters && (\n          <div className=\"px-3 md:px-6 pb-4 flex items-end gap-3 md:gap-4 flex-wrap\">",
  "new_string": "        {/* Filter panel — hidden on mobile, shown in drawer instead */}\n        {showFilters && (\n          <div className=\"px-3 md:px-6 pb-4 hidden md:flex items-end gap-3 md:gap-4 flex-wrap\">"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create InboxFilterDrawer component with account, label, smart label, and date sections",
      "status": "completed",
      "activeForm": "Creating InboxFilterDrawer component"
    },
    {
      "content": "Add showMobileFilters state and wire mobile filter button to open drawer",
      "status": "completed",
      "activeForm": "Adding mobile filter drawer state and wiring"
    },
    {
      "content": "Hide inline account/label/advanced filter rows on mobile",
      "status": "completed",
      "activeForm": "Hiding inline filter rows on mobile"
    },
    {
      "content": "Add active-filter badge to mobile filter icon",
      "status": "completed",
      "activeForm": "Adding active-filter badge to mobile filter icon"
    },
    {
      "content": "Render InboxFilterDrawer in the page",
      "status": "in_progress",
      "activeForm": "Rendering InboxFilterDrawer in the page"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    }
  ]
}
Now I need to render the `InboxFilterDrawer` in the page. Let me find the right spot — just before the closing `</header>` tag.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 1470,
  "limit": 10
}
I'll add the drawer right before the closing `</header>` tag. Actually, since the Drawer is a fixed-position overlay, it should go at the end of the component rather than inside the header. Let me find the very end of the component.

🔧 Tool: Grep
Input: {
  "pattern": "^}$",
  "path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 2495,
  "limit": 20
}
I'll add the `InboxFilterDrawer` right before the closing `</div>` of the component (line 2509, before `</div>`).

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "      </Modal>\n    </div>\n  );\n}",
  "new_string": "      </Modal>\n\n      {/* Mobile filter drawer */}\n      <div className=\"md:hidden\">\n        <InboxFilterDrawer\n          open={showMobileFilters}\n          onClose={() => setShowMobileFilters(false)}\n          accounts={accounts}\n          filterAccount={filterAccount}\n          setFilterAccount={setFilterAccount}\n          setFilterProvider={setFilterProvider}\n          allLabels={allLabels}\n          filterLabel={filterLabel}\n          setFilterLabel={setFilterLabel}\n          allSmartLabels={allSmartLabels}\n          filterSmartLabel={filterSmartLabel}\n          setFilterSmartLabel={setFilterSmartLabel}\n          afterDate={afterDate}\n          setAfterDate={setAfterDate}\n          beforeDate={beforeDate}\n          setBeforeDate={setBeforeDate}\n          hasActiveFilters={!!hasActiveFilters}\n          clearFilters={clearFilters}\n          hasFetchedOnce={hasFetchedOnce}\n          setPage={setPage}\n        />\n      </div>\n    </div>\n  );\n}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create InboxFilterDrawer component with account, label, smart label, and date sections",
      "status": "completed",
      "activeForm": "Creating InboxFilterDrawer component"
    },
    {
      "content": "Add showMobileFilters state and wire mobile filter button to open drawer",
      "status": "completed",
      "activeForm": "Adding mobile filter drawer state and wiring"
    },
    {
      "content": "Hide inline account/label/advanced filter rows on mobile",
      "status": "completed",
      "activeForm": "Hiding inline filter rows on mobile"
    },
    {
      "content": "Add active-filter badge to mobile filter icon",
      "status": "completed",
      "activeForm": "Adding active-filter badge to mobile filter icon"
    },
    {
      "content": "Render InboxFilterDrawer in the page",
      "status": "completed",
      "activeForm": "Rendering InboxFilterDrawer in the page"
    },
    {
      "content": "Build and verify",
      "status": "in_progress",
      "activeForm": "Building and verifying"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx next build 2>&1 | tail -40",
  "description": "Build Next.js app to verify changes",
  "timeout": 120000
}
Build succeeded. Let me verify it completed cleanly.

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx next build 2>&1 | grep -i \"error\\|fail\\|successfully\\|compiled\"",
  "description": "Check for build errors",
  "timeout": 120000
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create InboxFilterDrawer component with account, label, smart label, and date sections",
      "status": "completed",
      "activeForm": "Creating InboxFilterDrawer component"
    },
    {
      "content": "Add showMobileFilters state and wire mobile filter button to open drawer",
      "status": "completed",
      "activeForm": "Adding mobile filter drawer state and wiring"
    },
    {
      "content": "Hide inline account/label/advanced filter rows on mobile",
      "status": "completed",
      "activeForm": "Hiding inline filter rows on mobile"
    },
    {
      "content": "Add active-filter badge to mobile filter icon",
      "status": "completed",
      "activeForm": "Adding active-filter badge to mobile filter icon"
    },
    {
      "content": "Render InboxFilterDrawer in the page",
      "status": "completed",
      "activeForm": "Rendering InboxFilterDrawer in the page"
    },
    {
      "content": "Build and verify",
      "status": "completed",
      "activeForm": "Building and verifying"
    }
  ]
}
Build passes cleanly. Here's a summary of what was done:

**Created: `components/email/InboxFilterDrawer.tsx`**
- New mobile-optimized filter drawer component using the existing `<Drawer>` component
- **Account section**: Radio-style list with provider icons and larger touch targets (44px rows)
- **Labels section**: Color-coded chip buttons in a wrapping layout, larger than desktop (text-sm, px-3 py-1.5)
- **Smart Labels section**: Same touch-friendly chip layout
- **Date Range section**: Full-width date inputs stacked vertically
- **Clear all** button at the bottom with active filter count

**Modified: `app/(app)/inbox/page.tsx`**
- Added `showMobileFilters` state
- Mobile filter icon button now opens the drawer (instead of toggling inline `showFilters`)
- Added active-filter count badge (shows number on the filter icon when filters are active)
- Account filter chips row: `hidden md:flex` (hidden on mobile, visible on desktop)
- Label/smart label filter chips row: `hidden md:flex` (hidden on mobile, visible on desktop)
- Advanced filter panel: `hidden md:flex` (hidden on mobile, visible on desktop)
- Rendered `<InboxFilterDrawer>` wrapped in `md:hidden` at the bottom of the component

Desktop layout is completely unchanged — all mobile changes are gated behind `md:` breakpoint classes.