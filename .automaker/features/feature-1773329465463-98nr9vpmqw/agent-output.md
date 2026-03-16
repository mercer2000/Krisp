

I'll start by exploring the codebase to understand the existing structure for Analytics, Meetings, and navigation.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Analytics, Meetings, and navigation structure",
      "status": "in_progress",
      "activeForm": "Exploring existing codebase structure"
    },
    {
      "content": "Plan implementation approach",
      "status": "pending",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Remove Analytics from sidebar navigation",
      "status": "pending",
      "activeForm": "Removing Analytics from sidebar navigation"
    },
    {
      "content": "Add tabbed layout to Meetings page (Meetings + Analytics tabs)",
      "status": "pending",
      "activeForm": "Adding tabbed layout to Meetings page"
    },
    {
      "content": "Merge meeting breakdown into Meeting Detail page",
      "status": "pending",
      "activeForm": "Merging meeting breakdown into Meeting Detail page"
    },
    {
      "content": "Add redirect from old Analytics route to Meetings?tab=analytics",
      "status": "pending",
      "activeForm": "Adding redirect from old Analytics route"
    },
    {
      "content": "Clean up orphaned code and verify no broken links",
      "status": "pending",
      "activeForm": "Cleaning up orphaned code"
    }
  ]
}

🔧 Tool: Task
Input: {
  "description": "Explore Analytics structure",
  "prompt": "Explore the codebase to find all files related to Analytics functionality. Search for:\n1. Any analytics pages/routes (look in app/ directory)\n2. Analytics components (look in components/ directory)\n3. Analytics API routes\n4. Any analytics-related hooks or data fetching\n\nAlso look for the sidebar/navigation component to understand how Analytics is listed there. Search for \"analytics\" and \"Analytics\" across the codebase. Report back all file paths and their purposes.",
  "subagent_type": "Explore"
}

🔧 Tool: Task
Input: {
  "description": "Explore Meetings structure",
  "prompt": "Explore the codebase to find all files related to Meetings functionality. Search for:\n1. Meeting pages/routes (look in app/ directory for meetings-related routes)\n2. Meeting components (look in components/ directory)\n3. Meeting API routes\n4. Meeting detail pages\n5. Meeting breakdown components/views\n6. Any meeting-related hooks or data fetching\n\nSearch for \"meetings\", \"meeting\", \"Meeting\" across the codebase. Report back all file paths and their purposes, especially:\n- The main meetings list page\n- Individual meeting detail page\n- Any meeting breakdown component",
  "subagent_type": "Explore"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*analytics*"
}

🔧 Tool: Grep
Input: {
  "pattern": "analytics|Analytics",
  "output_mode": "files_with_matches"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/**/analytics/**"
}

🔧 Tool: Glob
Input: {
  "pattern": "components/**/analytics/**"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*meeting*"
}

🔧 Tool: Task
Input: {
  "description": "Explore navigation/sidebar",
  "prompt": "Find and examine the navigation/sidebar components in this Next.js codebase. Look for:\n1. The main sidebar or navigation component (check components/ui/SideNav.tsx, components/ui/AppShell.tsx, or similar)\n2. How navigation items are defined (array of items, routes, icons)\n3. Where \"Analytics\" appears in navigation\n4. Where \"Meetings\" appears in navigation\n\nRead the full content of the sidebar/navigation files and report back the structure. I need to understand how nav items are defined so I can remove Analytics and keep Meetings.",
  "subagent_type": "Explore"
}

🔧 Tool: Grep
Input: {
  "pattern": "meeting",
  "type": "ts,tsx,js,jsx",
  "output_mode": "files_with_matches"
}

🔧 Tool: Grep
Input: {
  "pattern": "Meeting",
  "type": "ts,tsx,js,jsx",
  "output_mode": "files_with_matches"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\SideNav.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\AppShell.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\analytics\\page.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/**/*meeting*"
}

🔧 Tool: Glob
Input: {
  "pattern": "components/**/*meeting*"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\analytics\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\MobileBottomNav.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\analytics.ts"
}

🔧 Tool: Bash
Input: {
  "command": "find C:\\Code\\Krisp/app -type f -name \"*meeting*\" 2>/dev/null"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\krisp\\analytics.ts"
}

🔧 Tool: Bash
Input: {
  "command": "find C:\\Code\\Krisp/components -type f -name \"*meeting*\" 2>/dev/null"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\SideNav.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\MobileBottomNav.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la C:\\Code\\Krisp/app/ | grep -i meeting"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la C:\\Code\\Krisp/app/api/ | head -20"
}

🔧 Tool: Bash
Input: {
  "command": "find C:\\Code\\Krisp/app -type d | grep -i meeting"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\" -type f -name \"*analytics*\" -not -path \"*node_modules*\" -not -path \"*.next*\" | head -20"
}

🔧 Tool: Bash
Input: {
  "command": "find app -type d -name \"*meeting*\" 2>/dev/null || echo \"No meeting directories found\""
}

🔧 Tool: Bash
Input: {
  "command": "find . -name \"*.tsx\" -o -name \"*.ts\" | xargs grep -l \"meeting\" 2>/dev/null | head -20"
}

🔧 Tool: Bash
Input: {
  "command": "find app/api/meetings -type f | sort"
}

🔧 Tool: Bash
Input: {
  "command": "find app/api/v1/cards/[id]/meeting -type f | sort"
}

🔧 Tool: Bash
Input: {
  "command": "find components -type f -name \"*eeting*\" -o -name \"*Meeting*\" | sort"
}

🔧 Tool: Bash
Input: {
  "command": "find app -type f -path \"*/meeting*\" | sort"
}

🔧 Tool: Bash
Input: {
  "command": "find app -type f -name \"page.tsx\" | xargs grep -l \"meeting\" 2>/dev/null"
}

🔧 Tool: Bash
Input: {
  "command": "find lib -type f -name \"*.ts\" | xargs grep -l \"meeting\" 2>/dev/null"
}

🔧 Tool: Bash
Input: {
  "command": "grep -r \"meeting\" types/ 2>/dev/null | cut -d: -f1 | sort -u"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\meetings\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\meetings\\[id]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\meetings\\participants\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\v1\\cards\\[id]\\meeting\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\meeting\\MeetingDetailDrawer.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\meeting\\MeetingFilters.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "grep -r \"useMeetingFilters\\|MeetingDetailDrawer\\|MeetingFilters\" lib/ types/ --include=\"*.ts\" --include=\"*.tsx\" 2>/dev/null | cut -d: -f1 | sort -u"
}

🔧 Tool: Bash
Input: {
  "command": "grep -r \"getRecentWebhookKeyPoints\\|getFilteredMeetings\\|getMeetingById\" lib/ --include=\"*.ts\" --include=\"*.tsx\" 2>/dev/null | cut -d: -f1 | sort -u"
}

🔧 Tool: Bash
Input: {
  "command": "find app -name \"page.tsx\" -path \"*app*\" -exec grep -l \"Meeting\" {} \\; 2>/dev/null"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useMeetingFilters.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\krisp\\webhookKeyPoints.ts",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\krisp\\webhookKeyPoints.ts",
  "offset": 100,
  "limit": 150
}

🔧 Tool: Bash
Input: {
  "command": "grep -l \"meeting\\|Meeting\" app/\\(app\\)/**/page.tsx | head -5"
}

🔧 Tool: Bash
Input: {
  "command": "find . -path \"./components/meeting\" -type d"
}

🔧 Tool: Bash
Input: {
  "command": "grep -r \"MeetingDetailDrawer\\|MeetingFilters\" app/ --include=\"*.tsx\" 2>/dev/null"
}

🔧 Tool: Bash
Input: {
  "command": "find app -name \"*krisp*\" -o -name \"*activity*\" | head -10"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\krisp\\page.tsx",
  "limit": 200
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\krisp\\webhookKeyPoints.ts",
  "offset": 250,
  "limit": 150
}

🔧 Tool: Bash
Input: {
  "command": "grep -n \"export async function\\|export function\" lib/krisp/webhookKeyPoints.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\krisp\\webhookKeyPoints.ts",
  "offset": 430,
  "limit": 50
}

🔧 Tool: Bash
Input: {
  "command": "ls -la C:\\Code\\Krisp\\components\\meeting\\"
}

🔧 Tool: Bash
Input: {
  "command": "find components/meeting -type f"
}

🔧 Tool: Bash
Input: {
  "command": "grep -r \"getAllParticipants\\|getFilteredMeetings\\|getRecentWebhookKeyPoints\" app/ --include=\"*.tsx\" --include=\"*.ts\" 2>/dev/null | head -20"
}
Excellent. I now have a clear picture of the codebase. Let me read the key files I'll need to modify.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Analytics, Meetings, and navigation structure",
      "status": "completed",
      "activeForm": "Exploring existing codebase structure"
    },
    {
      "content": "Plan implementation approach",
      "status": "in_progress",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Remove Analytics from sidebar navigation",
      "status": "pending",
      "activeForm": "Removing Analytics from sidebar navigation"
    },
    {
      "content": "Add tabbed layout to Meetings page (Meetings + Analytics tabs)",
      "status": "pending",
      "activeForm": "Adding tabbed layout to Meetings page"
    },
    {
      "content": "Merge meeting breakdown into Meeting Detail page",
      "status": "pending",
      "activeForm": "Merging meeting breakdown into Meeting Detail page"
    },
    {
      "content": "Add redirect from old Analytics route to Meetings?tab=analytics",
      "status": "pending",
      "activeForm": "Adding redirect from old Analytics route"
    },
    {
      "content": "Clean up orphaned code and verify no broken links",
      "status": "pending",
      "activeForm": "Cleaning up orphaned code"
    }
  ]
}
Let me read the key files I need to modify.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\krisp\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\analytics\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\SideNav.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\MobileBottomNav.tsx"
}
Now let me also check if there's a CommandPalette that references analytics, and look at the MeetingDetailDrawer to understand what's already there.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\meeting\\MeetingDetailDrawer.tsx",
  "limit": 50
}

🔧 Tool: Grep
Input: {
  "pattern": "analytics|Analytics",
  "path": "C:\\Code\\Krisp\\components\\ui\\CommandPalette.tsx",
  "output_mode": "content"
}

🔧 Tool: Grep
Input: {
  "pattern": "analytics|/analytics",
  "path": "C:\\Code\\Krisp\\lib\\shortcuts",
  "output_mode": "content"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\shortcuts\\registry.ts",
  "offset": 140,
  "limit": 20
}
Good, I now have a full picture. Let me plan and start implementing. The implementation plan is clear:

1. **Remove Analytics from nav** — SideNav.tsx (remove from NAV_ITEMS + isActive), MobileBottomNav.tsx (remove from MORE_ITEMS + isActive), shortcuts/registry.ts (update shortcut to point to /krisp?tab=analytics)
2. **Add tabbed layout to Meetings page** — Modify `app/(app)/krisp/page.tsx` to add Meetings/Analytics tabs with URL-based tab state
3. **Extract analytics content into a component** — Create a reusable `AnalyticsDashboard` component from the analytics page content (without standalone header)
4. **Redirect old /analytics route** — Replace the analytics page with a redirect to `/krisp?tab=analytics`
5. **Meeting breakdown is already in the MeetingDetailDrawer** — The analytics page has its own "meeting breakdown" section which is the expandable per-meeting analytics. This should be preserved in the Analytics tab.
6. **Clean up**

Let me implement all of this now.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Analytics, Meetings, and navigation structure",
      "status": "completed",
      "activeForm": "Exploring existing codebase structure"
    },
    {
      "content": "Plan implementation approach",
      "status": "completed",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Remove Analytics from sidebar navigation",
      "status": "in_progress",
      "activeForm": "Removing Analytics from sidebar navigation"
    },
    {
      "content": "Add tabbed layout to Meetings page (Meetings + Analytics tabs)",
      "status": "pending",
      "activeForm": "Adding tabbed layout to Meetings page"
    },
    {
      "content": "Merge meeting breakdown into Meeting Detail page",
      "status": "pending",
      "activeForm": "Merging meeting breakdown into Meeting Detail page"
    },
    {
      "content": "Add redirect from old Analytics route to Meetings?tab=analytics",
      "status": "pending",
      "activeForm": "Adding redirect from old Analytics route"
    },
    {
      "content": "Clean up orphaned code and verify no broken links",
      "status": "pending",
      "activeForm": "Cleaning up orphaned code"
    }
  ]
}
Now let me make the navigation changes in parallel.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\components\\ui\\SideNav.tsx",
  "old_string": "  {\n    key: \"analytics\",\n    label: \"Analytics\",\n    href: \"/analytics\",\n    icon: AnalyticsIcon,\n  },\n  {",
  "new_string": "  {"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\components\\ui\\MobileBottomNav.tsx",
  "old_string": "  { key: \"analytics\", label: \"Analytics\", href: \"/analytics\", icon: AnalyticsMoreIcon },\n  { key: \"activity\",",
  "new_string": "  { key: \"activity\","
}
Now remove the analytics `isActive` checks from both navigation files.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\components\\ui\\SideNav.tsx",
  "old_string": "    if (href === \"/analytics\") return pathname === \"/analytics\";\n    if (href === \"/activity\")",
  "new_string": "    if (href === \"/activity\")"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\components\\ui\\MobileBottomNav.tsx",
  "old_string": "    if (href === \"/analytics\") return pathname === \"/analytics\";\n    if (href === \"/activity\")",
  "new_string": "    if (href === \"/activity\")"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\shortcuts\\registry.ts",
  "old_string": "    id: \"nav-analytics\",\n    label: \"Go to Analytics\",\n    category: \"Navigation\",\n    keys: [],\n    action: { type: \"navigate\", href: \"/analytics\" },",
  "new_string": "    id: \"nav-analytics\",\n    label: \"Go to Analytics\",\n    category: \"Navigation\",\n    keys: [],\n    action: { type: \"navigate\", href: \"/krisp?tab=analytics\" },"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Analytics, Meetings, and navigation structure",
      "status": "completed",
      "activeForm": "Exploring existing codebase structure"
    },
    {
      "content": "Plan implementation approach",
      "status": "completed",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Remove Analytics from sidebar navigation",
      "status": "completed",
      "activeForm": "Removing Analytics from sidebar navigation"
    },
    {
      "content": "Add tabbed layout to Meetings page (Meetings + Analytics tabs)",
      "status": "in_progress",
      "activeForm": "Adding tabbed layout to Meetings page"
    },
    {
      "content": "Merge meeting breakdown into Meeting Detail page",
      "status": "pending",
      "activeForm": "Merging meeting breakdown into Meeting Detail page"
    },
    {
      "content": "Add redirect from old Analytics route to Meetings?tab=analytics",
      "status": "pending",
      "activeForm": "Adding redirect from old Analytics route"
    },
    {
      "content": "Clean up orphaned code and verify no broken links",
      "status": "pending",
      "activeForm": "Cleaning up orphaned code"
    }
  ]
}
Now I need to create the `AnalyticsDashboard` component (extracted from the analytics page, without the header/shell wrapper) and then modify the Krisp meetings page to include tabbed layout. Let me first extract the analytics content into a component.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\analytics\\page.tsx"
}
Now I'll create the `AnalyticsDashboard` component and then update both the Krisp page and the old analytics page. Let me do this in parallel.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\meeting\\AnalyticsDashboard.tsx",
  "content": "\"use client\";\n\nimport { useState, useEffect, useMemo } from \"react\";\nimport type {\n  AnalyticsSummary,\n  MeetingAnalytics,\n  AnalyticsTrend,\n  SpeakerTalkTime,\n} from \"@/types/analytics\";\n\n// ---------------------------------------------------------------------------\n// SVG chart helpers\n// ---------------------------------------------------------------------------\n\nconst CHART_COLORS = [\n  \"#6366f1\", \"#f59e0b\", \"#10b981\", \"#ef4444\", \"#8b5cf6\",\n  \"#ec4899\", \"#14b8a6\", \"#f97316\",\n];\n\nfunction SentimentBadge({ value }: { value: number }) {\n  const label =\n    value > 0.15 ? \"Positive\" : value < -0.15 ? \"Negative\" : \"Neutral\";\n  const color =\n    value > 0.15\n      ? \"text-emerald-500\"\n      : value < -0.15\n        ? \"text-red-500\"\n        : \"text-[var(--muted-foreground)]\";\n  return <span className={`text-sm font-medium ${color}`}>{label}</span>;\n}\n\nfunction MiniBar({\n  value,\n  max,\n  color,\n}: {\n  value: number;\n  max: number;\n  color: string;\n}) {\n  const width = max > 0 ? (value / max) * 100 : 0;\n  return (\n    <div className=\"h-2 w-full rounded-full bg-[var(--secondary)]\">\n      <div\n        className=\"h-2 rounded-full transition-all\"\n        style={{ width: `${width}%`, backgroundColor: color }}\n      />\n    </div>\n  );\n}\n\nfunction TrendLineChart({\n  data,\n  dataKey,\n  color,\n  height = 120,\n  label,\n  formatY,\n}: {\n  data: AnalyticsTrend[];\n  dataKey: \"sentimentAvg\" | \"engagementAvg\" | \"meetingCount\";\n  color: string;\n  height?: number;\n  label: string;\n  formatY?: (v: number) => string;\n}) {\n  if (data.length === 0) {\n    return (\n      <div\n        className=\"flex items-center justify-center text-sm text-[var(--muted-foreground)]\"\n        style={{ height }}\n      >\n        No trend data yet\n      </div>\n    );\n  }\n\n  const values = data.map((d) => d[dataKey]);\n  const minVal = Math.min(...values);\n  const maxVal = Math.max(...values);\n  const range = maxVal - minVal || 1;\n  const padding = 30;\n  const chartWidth = 400;\n  const chartHeight = height - 20;\n\n  const points = data.map((d, i) => {\n    const x = padding + (i / Math.max(data.length - 1, 1)) * (chartWidth - padding * 2);\n    const y = chartHeight - padding - ((d[dataKey] - minVal) / range) * (chartHeight - padding * 2);\n    return { x, y, d };\n  });\n\n  const pathD = points\n    .map((p, i) => `${i === 0 ? \"M\" : \"L\"} ${p.x} ${p.y}`)\n    .join(\" \");\n\n  // Area fill\n  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;\n\n  return (\n    <div>\n      <div className=\"text-xs font-medium text-[var(--muted-foreground)] mb-2\">\n        {label}\n      </div>\n      <svg\n        viewBox={`0 0 ${chartWidth} ${chartHeight}`}\n        className=\"w-full\"\n        style={{ height }}\n      >\n        {/* Area fill */}\n        <path d={areaD} fill={color} opacity={0.1} />\n        {/* Line */}\n        <path d={pathD} fill=\"none\" stroke={color} strokeWidth={2} />\n        {/* Data points */}\n        {points.map((p, i) => (\n          <g key={i}>\n            <circle cx={p.x} cy={p.y} r={3} fill={color} />\n            {/* Show value on hover via title */}\n            <title>\n              {p.d.date}: {formatY ? formatY(p.d[dataKey]) : p.d[dataKey]}\n            </title>\n          </g>\n        ))}\n        {/* X-axis labels */}\n        {points.length <= 15 &&\n          points.map((p, i) => (\n            <text\n              key={i}\n              x={p.x}\n              y={chartHeight - 5}\n              textAnchor=\"middle\"\n              className=\"fill-[var(--muted-foreground)]\"\n              fontSize={9}\n            >\n              {p.d.date.slice(5)}\n            </text>\n          ))}\n        {/* Y-axis labels */}\n        <text\n          x={5}\n          y={padding}\n          className=\"fill-[var(--muted-foreground)]\"\n          fontSize={9}\n        >\n          {formatY ? formatY(maxVal) : maxVal}\n        </text>\n        <text\n          x={5}\n          y={chartHeight - padding}\n          className=\"fill-[var(--muted-foreground)]\"\n          fontSize={9}\n        >\n          {formatY ? formatY(minVal) : minVal}\n        </text>\n      </svg>\n    </div>\n  );\n}\n\nfunction DonutChart({\n  slices,\n  size = 100,\n}: {\n  slices: { label: string; value: number; color: string }[];\n  size?: number;\n}) {\n  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;\n  const r = size / 2 - 6;\n  const cx = size / 2;\n  const cy = size / 2;\n  const circumference = 2 * Math.PI * r;\n\n  let offset = 0;\n  const arcs = slices.map((sl) => {\n    const pct = sl.value / total;\n    const dashLength = pct * circumference;\n    const dashOffset = -offset;\n    offset += dashLength;\n    return { ...sl, dashLength, dashOffset, pct };\n  });\n\n  return (\n    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>\n      {arcs.map((arc, i) => (\n        <circle\n          key={i}\n          cx={cx}\n          cy={cy}\n          r={r}\n          fill=\"none\"\n          stroke={arc.color}\n          strokeWidth={10}\n          strokeDasharray={`${arc.dashLength} ${circumference - arc.dashLength}`}\n          strokeDashoffset={arc.dashOffset}\n          transform={`rotate(-90 ${cx} ${cy})`}\n        >\n          <title>\n            {arc.label}: {Math.round(arc.pct * 100)}%\n          </title>\n        </circle>\n      ))}\n    </svg>\n  );\n}\n\nfunction TalkTimeBar({\n  speakers,\n}: {\n  speakers: SpeakerTalkTime[];\n}) {\n  if (speakers.length === 0) {\n    return (\n      <div className=\"text-sm text-[var(--muted-foreground)]\">\n        No speaker data\n      </div>\n    );\n  }\n\n  return (\n    <div className=\"space-y-2\">\n      {speakers.map((s, i) => (\n        <div key={s.speaker} className=\"flex items-center gap-3\">\n          <div className=\"w-24 text-xs text-[var(--foreground)] truncate\" title={s.speaker}>\n            {s.speaker}\n          </div>\n          <div className=\"flex-1\">\n            <MiniBar value={s.percentage} max={100} color={CHART_COLORS[i % CHART_COLORS.length]} />\n          </div>\n          <div className=\"w-12 text-xs text-[var(--muted-foreground)] text-right\">\n            {s.percentage}%\n          </div>\n        </div>\n      ))}\n    </div>\n  );\n}\n\nfunction ScoreGauge({ score, label }: { score: number; label: string }) {\n  const r = 40;\n  const circumference = Math.PI * r; // semicircle\n  const progress = (score / 100) * circumference;\n  const color =\n    score >= 70 ? \"#10b981\" : score >= 40 ? \"#f59e0b\" : \"#ef4444\";\n\n  return (\n    <div className=\"flex flex-col items-center\">\n      <svg width={100} height={60} viewBox=\"0 0 100 60\">\n        <path\n          d=\"M 10 55 A 40 40 0 0 1 90 55\"\n          fill=\"none\"\n          stroke=\"var(--secondary)\"\n          strokeWidth={8}\n          strokeLinecap=\"round\"\n        />\n        <path\n          d=\"M 10 55 A 40 40 0 0 1 90 55\"\n          fill=\"none\"\n          stroke={color}\n          strokeWidth={8}\n          strokeLinecap=\"round\"\n          strokeDasharray={`${progress} ${circumference}`}\n        />\n        <text\n          x={50}\n          y={48}\n          textAnchor=\"middle\"\n          className=\"fill-[var(--foreground)]\"\n          fontSize={18}\n          fontWeight=\"bold\"\n        >\n          {score}\n        </text>\n      </svg>\n      <span className=\"text-xs text-[var(--muted-foreground)] mt-1\">\n        {label}\n      </span>\n    </div>\n  );\n}\n\n// ---------------------------------------------------------------------------\n// AnalyticsDashboard — embeddable analytics content (no page shell)\n// ---------------------------------------------------------------------------\n\nexport function AnalyticsDashboard() {\n  const [data, setData] = useState<AnalyticsSummary | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState<string | null>(null);\n  const [selectedMeeting, setSelectedMeeting] =\n    useState<MeetingAnalytics | null>(null);\n\n  useEffect(() => {\n    async function fetchAnalytics() {\n      try {\n        const res = await fetch(\"/api/analytics\");\n        if (!res.ok) throw new Error(\"Failed to fetch analytics\");\n        const json = await res.json();\n        setData(json);\n      } catch {\n        setError(\"Failed to load analytics data.\");\n      } finally {\n        setLoading(false);\n      }\n    }\n    fetchAnalytics();\n  }, []);\n\n  const sentimentSlices = useMemo(() => {\n    if (!data) return [];\n    return [\n      { label: \"Positive\", value: data.overallSentiment.positive, color: \"#10b981\" },\n      { label: \"Neutral\", value: data.overallSentiment.neutral, color: \"#94a3b8\" },\n      { label: \"Negative\", value: data.overallSentiment.negative, color: \"#ef4444\" },\n    ];\n  }, [data]);\n\n  const formatDate = (dateStr: string | null) => {\n    if (!dateStr) return \"Unknown\";\n    return new Date(dateStr).toLocaleDateString(\"en-US\", {\n      month: \"short\",\n      day: \"numeric\",\n      year: \"numeric\",\n    });\n  };\n\n  const formatDuration = (seconds: number | null) => {\n    if (!seconds) return \"--\";\n    const mins = Math.floor(seconds / 60);\n    if (mins < 60) return `${mins}m`;\n    return `${Math.floor(mins / 60)}h ${mins % 60}m`;\n  };\n\n  if (loading) {\n    return (\n      <div className=\"max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6\">\n        {[1, 2, 3, 4, 5, 6].map((i) => (\n          <div\n            key={i}\n            className=\"p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg animate-pulse\"\n          >\n            <div className=\"h-5 bg-[var(--secondary)] rounded w-3/4 mb-3\" />\n            <div className=\"h-20 bg-[var(--secondary)] rounded w-full\" />\n          </div>\n        ))}\n      </div>\n    );\n  }\n\n  if (error || !data) {\n    return (\n      <div className=\"flex items-center justify-center py-16\">\n        <div className=\"text-center\">\n          <p className=\"text-[var(--destructive)]\">{error || \"No data available\"}</p>\n        </div>\n      </div>\n    );\n  }\n\n  return (\n    <div className=\"max-w-6xl mx-auto space-y-8\">\n      {/* Subtitle */}\n      <p className=\"text-sm text-[var(--muted-foreground)]\">\n        Sentiment trends, talk-time distribution, and engagement scores\n        across {data.totalMeetings} meeting{data.totalMeetings !== 1 ? \"s\" : \"\"}\n      </p>\n\n      {/* Summary Cards */}\n      <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4\">\n        {/* Total Meetings */}\n        <div className=\"p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg\">\n          <div className=\"text-sm text-[var(--muted-foreground)] mb-1\">\n            Total Meetings\n          </div>\n          <div className=\"text-3xl font-bold text-[var(--foreground)]\">\n            {data.totalMeetings}\n          </div>\n        </div>\n\n        {/* Overall Sentiment */}\n        <div className=\"p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg\">\n          <div className=\"text-sm text-[var(--muted-foreground)] mb-1\">\n            Overall Sentiment\n          </div>\n          <div className=\"flex items-center gap-3\">\n            <DonutChart slices={sentimentSlices} size={50} />\n            <SentimentBadge value={data.overallSentiment.overall} />\n          </div>\n        </div>\n\n        {/* Engagement Score */}\n        <div className=\"p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg\">\n          <div className=\"text-sm text-[var(--muted-foreground)] mb-1\">\n            Avg Engagement\n          </div>\n          <ScoreGauge score={data.overallEngagement} label=\"\" />\n        </div>\n\n        {/* Top Speaker */}\n        <div className=\"p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg\">\n          <div className=\"text-sm text-[var(--muted-foreground)] mb-1\">\n            Most Active Speaker\n          </div>\n          {data.topSpeakers.length > 0 ? (\n            <div>\n              <div className=\"text-lg font-semibold text-[var(--foreground)] truncate\">\n                {data.topSpeakers[0].speaker}\n              </div>\n              <div className=\"text-xs text-[var(--muted-foreground)]\">\n                {data.topSpeakers[0].totalWords.toLocaleString()} words across{\" \"}\n                {data.topSpeakers[0].meetingCount} meeting\n                {data.topSpeakers[0].meetingCount !== 1 ? \"s\" : \"\"}\n              </div>\n            </div>\n          ) : (\n            <div className=\"text-sm text-[var(--muted-foreground)]\">--</div>\n          )}\n        </div>\n      </div>\n\n      {/* Trend Charts */}\n      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n        <div className=\"p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg\">\n          <TrendLineChart\n            data={data.trends}\n            dataKey=\"sentimentAvg\"\n            color=\"#6366f1\"\n            height={160}\n            label=\"Sentiment Over Time\"\n            formatY={(v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))}\n          />\n        </div>\n        <div className=\"p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg\">\n          <TrendLineChart\n            data={data.trends}\n            dataKey=\"engagementAvg\"\n            color=\"#10b981\"\n            height={160}\n            label=\"Engagement Over Time\"\n            formatY={(v) => `${Math.round(v)}`}\n          />\n        </div>\n      </div>\n\n      {/* Top Speakers & Meeting Count Trend */}\n      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n        {/* Top Speakers */}\n        <div className=\"p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg\">\n          <h3 className=\"text-sm font-medium text-[var(--foreground)] mb-4\">\n            Top Speakers (by word count)\n          </h3>\n          {data.topSpeakers.length > 0 ? (\n            <div className=\"space-y-3\">\n              {data.topSpeakers.slice(0, 8).map((s, i) => (\n                <div key={s.speaker} className=\"flex items-center gap-3\">\n                  <div className=\"w-28 text-xs text-[var(--foreground)] truncate\" title={s.speaker}>\n                    {s.speaker}\n                  </div>\n                  <div className=\"flex-1\">\n                    <MiniBar\n                      value={s.totalWords}\n                      max={data.topSpeakers[0].totalWords}\n                      color={CHART_COLORS[i % CHART_COLORS.length]}\n                    />\n                  </div>\n                  <div className=\"w-16 text-xs text-[var(--muted-foreground)] text-right\">\n                    {s.totalWords.toLocaleString()}\n                  </div>\n                </div>\n              ))}\n            </div>\n          ) : (\n            <div className=\"text-sm text-[var(--muted-foreground)]\">\n              No speaker data available\n            </div>\n          )}\n        </div>\n\n        {/* Meeting Count Trend */}\n        <div className=\"p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg\">\n          <TrendLineChart\n            data={data.trends}\n            dataKey=\"meetingCount\"\n            color=\"#f59e0b\"\n            height={160}\n            label=\"Meetings Per Day\"\n            formatY={(v) => `${Math.round(v)}`}\n          />\n        </div>\n      </div>\n\n      {/* Individual Meeting Breakdown */}\n      <div>\n        <h2 className=\"text-lg font-semibold text-[var(--foreground)] mb-4\">\n          Meeting Breakdown\n        </h2>\n        <div className=\"space-y-3\">\n          {data.meetings.map((m) => (\n            <div\n              key={m.meetingId}\n              className={`p-4 bg-[var(--card)] border rounded-lg cursor-pointer transition-all ${\n                selectedMeeting?.meetingId === m.meetingId\n                  ? \"border-[var(--primary)] ring-1 ring-[var(--primary)]\"\n                  : \"border-[var(--border)] hover:border-[var(--muted-foreground)]\"\n              }`}\n              onClick={() =>\n                setSelectedMeeting(\n                  selectedMeeting?.meetingId === m.meetingId ? null : m\n                )\n              }\n            >\n              <div className=\"flex flex-wrap items-center gap-x-6 gap-y-2\">\n                <div className=\"flex-1 min-w-[200px]\">\n                  <div className=\"font-medium text-[var(--foreground)] leading-snug\">\n                    {m.meetingTitle || \"Untitled Meeting\"}\n                  </div>\n                  <div className=\"text-xs text-[var(--muted-foreground)] mt-0.5\">\n                    {formatDate(m.meetingDate)} &middot;{\" \"}\n                    {formatDuration(m.duration)} &middot;{\" \"}\n                    {m.participantCount} participant{m.participantCount !== 1 ? \"s\" : \"\"}\n                  </div>\n                </div>\n                <div className=\"flex items-center gap-4\">\n                  <div className=\"text-center\">\n                    <SentimentBadge value={m.sentiment.overall} />\n                  </div>\n                  <div className=\"text-center\">\n                    <span\n                      className={`text-sm font-medium ${\n                        m.engagement.score >= 70\n                          ? \"text-emerald-500\"\n                          : m.engagement.score >= 40\n                            ? \"text-amber-500\"\n                            : \"text-red-500\"\n                      }`}\n                    >\n                      {m.engagement.score}\n                    </span>\n                    <span className=\"text-xs text-[var(--muted-foreground)] ml-1\">\n                      engagement\n                    </span>\n                  </div>\n                  <svg\n                    className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${\n                      selectedMeeting?.meetingId === m.meetingId\n                        ? \"rotate-180\"\n                        : \"\"\n                    }`}\n                    fill=\"none\"\n                    viewBox=\"0 0 24 24\"\n                    stroke=\"currentColor\"\n                  >\n                    <path\n                      strokeLinecap=\"round\"\n                      strokeLinejoin=\"round\"\n                      strokeWidth={2}\n                      d=\"M19 9l-7 7-7-7\"\n                    />\n                  </svg>\n                </div>\n              </div>\n\n              {/* Expanded detail */}\n              {selectedMeeting?.meetingId === m.meetingId && (\n                <div className=\"mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-3 gap-6\">\n                  {/* Sentiment Breakdown */}\n                  <div>\n                    <div className=\"text-xs font-medium text-[var(--muted-foreground)] mb-2\">\n                      Sentiment Breakdown\n                    </div>\n                    <div className=\"flex items-center gap-4\">\n                      <DonutChart\n                        slices={[\n                          {\n                            label: \"Positive\",\n                            value: m.sentiment.positive,\n                            color: \"#10b981\",\n                          },\n                          {\n                            label: \"Neutral\",\n                            value: m.sentiment.neutral,\n                            color: \"#94a3b8\",\n                          },\n                          {\n                            label: \"Negative\",\n                            value: m.sentiment.negative,\n                            color: \"#ef4444\",\n                          },\n                        ]}\n                        size={70}\n                      />\n                      <div className=\"space-y-1 text-xs\">\n                        <div className=\"flex items-center gap-2\">\n                          <span className=\"w-2 h-2 rounded-full bg-emerald-500\" />\n                          Positive: {Math.round(m.sentiment.positive * 100)}%\n                        </div>\n                        <div className=\"flex items-center gap-2\">\n                          <span className=\"w-2 h-2 rounded-full bg-slate-400\" />\n                          Neutral: {Math.round(m.sentiment.neutral * 100)}%\n                        </div>\n                        <div className=\"flex items-center gap-2\">\n                          <span className=\"w-2 h-2 rounded-full bg-red-500\" />\n                          Negative: {Math.round(m.sentiment.negative * 100)}%\n                        </div>\n                      </div>\n                    </div>\n                  </div>\n\n                  {/* Talk-Time Distribution */}\n                  <div>\n                    <div className=\"text-xs font-medium text-[var(--muted-foreground)] mb-2\">\n                      Talk-Time Distribution\n                    </div>\n                    <TalkTimeBar speakers={m.talkTime} />\n                  </div>\n\n                  {/* Engagement Factors */}\n                  <div>\n                    <div className=\"text-xs font-medium text-[var(--muted-foreground)] mb-2\">\n                      Engagement Factors\n                    </div>\n                    <div className=\"space-y-2\">\n                      <div>\n                        <div className=\"flex justify-between text-xs mb-0.5\">\n                          <span className=\"text-[var(--muted-foreground)]\">\n                            Participant Balance\n                          </span>\n                          <span className=\"text-[var(--foreground)]\">\n                            {m.engagement.factors.participantBalance}\n                          </span>\n                        </div>\n                        <MiniBar\n                          value={m.engagement.factors.participantBalance}\n                          max={100}\n                          color=\"#6366f1\"\n                        />\n                      </div>\n                      <div>\n                        <div className=\"flex justify-between text-xs mb-0.5\">\n                          <span className=\"text-[var(--muted-foreground)]\">\n                            Key Points Density\n                          </span>\n                          <span className=\"text-[var(--foreground)]\">\n                            {m.engagement.factors.keyPointsDensity}\n                          </span>\n                        </div>\n                        <MiniBar\n                          value={m.engagement.factors.keyPointsDensity}\n                          max={100}\n                          color=\"#f59e0b\"\n                        />\n                      </div>\n                      <div>\n                        <div className=\"flex justify-between text-xs mb-0.5\">\n                          <span className=\"text-[var(--muted-foreground)]\">\n                            Duration Score\n                          </span>\n                          <span className=\"text-[var(--foreground)]\">\n                            {m.engagement.factors.duration}\n                          </span>\n                        </div>\n                        <MiniBar\n                          value={m.engagement.factors.duration}\n                          max={100}\n                          color=\"#10b981\"\n                        />\n                      </div>\n                    </div>\n                    <div className=\"mt-3 text-xs text-[var(--muted-foreground)]\">\n                      {m.keyPointsCount} key point{m.keyPointsCount !== 1 ? \"s\" : \"\"}\n                    </div>\n                  </div>\n                </div>\n              )}\n            </div>\n          ))}\n\n          {data.meetings.length === 0 && (\n            <div className=\"text-center py-16\">\n              <svg\n                className=\"w-16 h-16 mx-auto text-[var(--muted-foreground)]/30 mb-4\"\n                fill=\"none\"\n                viewBox=\"0 0 24 24\"\n                stroke=\"currentColor\"\n              >\n                <path\n                  strokeLinecap=\"round\"\n                  strokeLinejoin=\"round\"\n                  strokeWidth={1.5}\n                  d=\"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z\"\n                />\n              </svg>\n              <h3 className=\"text-xl font-medium text-[var(--foreground)] mb-2\">\n                No Analytics Data Yet\n              </h3>\n              <p className=\"text-[var(--muted-foreground)] max-w-md mx-auto\">\n                Analytics will appear here once meeting data is available from\n                Krisp webhooks.\n              </p>\n            </div>\n          )}\n        </div>\n      </div>\n    </div>\n  );\n}\n"
}
Now let me update the Krisp meetings page to add the tabbed layout with URL-based tab state.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\krisp\\page.tsx",
  "content": "\"use client\";\n\nimport { useState, useEffect, useCallback, Suspense } from \"react\";\nimport { useSearchParams, useRouter } from \"next/navigation\";\nimport { MeetingDetailDrawer } from \"@/components/meeting/MeetingDetailDrawer\";\nimport { MeetingFilters } from \"@/components/meeting/MeetingFilters\";\nimport { AnalyticsDashboard } from \"@/components/meeting/AnalyticsDashboard\";\nimport { useMeetingFilters } from \"@/lib/hooks/useMeetingFilters\";\n\ninterface KeyPointContent {\n  id: string;\n  description: string;\n}\n\ninterface Meeting {\n  id: number;\n  meeting_id: string;\n  meeting_title: string | null;\n  meeting_start_date: string | null;\n  meeting_end_date: string | null;\n  meeting_duration: number | null;\n  speakers: (string | { index: number; first_name?: string; last_name?: string })[];\n  participants: string[];\n  content: KeyPointContent[];\n  raw_content: string | null;\n  event_type: string | null;\n}\n\ninterface SearchResponse {\n  meetings: Meeting[];\n  answer: string;\n  searchQuery: string;\n}\n\ntype Tab = \"meetings\" | \"analytics\";\n\nfunction KrispPageInner() {\n  const searchParams = useSearchParams();\n  const router = useRouter();\n  const activeTab = (searchParams.get(\"tab\") as Tab) || \"meetings\";\n\n  const setActiveTab = (tab: Tab) => {\n    const params = new URLSearchParams(searchParams.toString());\n    if (tab === \"meetings\") {\n      params.delete(\"tab\");\n    } else {\n      params.set(\"tab\", tab);\n    }\n    const qs = params.toString();\n    router.push(qs ? `/krisp?${qs}` : \"/krisp\");\n  };\n\n  const [query, setQuery] = useState(\"\");\n  const [isLoading, setIsLoading] = useState(false);\n  const [result, setResult] = useState<SearchResponse | null>(null);\n  const [error, setError] = useState<string | null>(null);\n  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);\n\n  // Meeting detail drawer\n  const [openMeetingId, setOpenMeetingId] = useState<number | null>(null);\n\n  // All meetings loaded on page load\n  const [meetings, setMeetings] = useState<Meeting[]>([]);\n  const [meetingsLoading, setMeetingsLoading] = useState(true);\n  const [totalCount, setTotalCount] = useState(0);\n  const [unfilteredTotal, setUnfilteredTotal] = useState(0);\n\n  // Participants for filter dropdown\n  const [availableParticipants, setAvailableParticipants] = useState<string[]>([]);\n\n  // Filter state from URL params\n  const {\n    filters,\n    hasActiveFilters,\n    setFilters,\n    removeFilter,\n    clearAll,\n    buildQueryString,\n  } = useMeetingFilters();\n\n  // Fetch available participants once\n  useEffect(() => {\n    async function fetchParticipants() {\n      try {\n        const res = await fetch(\"/api/meetings/participants\");\n        if (res.ok) {\n          const data = await res.json();\n          setAvailableParticipants(data.participants ?? []);\n        }\n      } catch {\n        // Silently fail — participant filter will just show empty list\n      }\n    }\n    fetchParticipants();\n  }, []);\n\n  // Fetch meetings (with filters applied via query params)\n  const fetchMeetings = useCallback(async () => {\n    setMeetingsLoading(true);\n    try {\n      const qs = buildQueryString();\n      const isFiltered = qs.length > 0;\n      const url = isFiltered ? `/api/meetings?${qs}` : \"/api/meetings\";\n      const res = await fetch(url);\n      if (!res.ok) throw new Error(\"Failed to fetch\");\n      const data = await res.json();\n      setMeetings(data.meetings ?? []);\n      setTotalCount(data.total ?? data.meetings?.length ?? 0);\n      // When fetching without filters, also update the unfiltered total\n      if (!isFiltered) {\n        setUnfilteredTotal(data.total ?? data.meetings?.length ?? 0);\n      }\n    } catch {\n      console.error(\"Failed to load meetings\");\n    } finally {\n      setMeetingsLoading(false);\n    }\n  }, [buildQueryString]);\n\n  // Fetch unfiltered total once (only if filters are active on first load)\n  useEffect(() => {\n    if (!hasActiveFilters) return;\n    async function fetchUnfilteredTotal() {\n      try {\n        const res = await fetch(\"/api/meetings\");\n        if (res.ok) {\n          const data = await res.json();\n          setUnfilteredTotal(data.total ?? data.meetings?.length ?? 0);\n        }\n      } catch {\n        // ignore\n      }\n    }\n    fetchUnfilteredTotal();\n    // Only run once on mount — we only need the baseline count\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);\n\n  // Re-fetch when filters change\n  useEffect(() => {\n    fetchMeetings();\n  }, [fetchMeetings]);\n\n  const handleSearch = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!query.trim()) return;\n\n    setIsLoading(true);\n    setError(null);\n    setSelectedMeeting(null);\n\n    try {\n      const response = await fetch(\"/api/search\", {\n        method: \"POST\",\n        headers: {\n          \"Content-Type\": \"application/json\",\n        },\n        body: JSON.stringify({ query }),\n      });\n\n      if (!response.ok) {\n        throw new Error(\"Search failed\");\n      }\n\n      const data = await response.json();\n      setResult(data);\n    } catch (err) {\n      setError(\"Failed to search. Please try again.\");\n      console.error(err);\n    } finally {\n      setIsLoading(false);\n    }\n  };\n\n  const formatDate = (dateStr: string | null) => {\n    if (!dateStr) return \"Unknown date\";\n    return new Date(dateStr).toLocaleDateString(\"en-US\", {\n      year: \"numeric\",\n      month: \"long\",\n      day: \"numeric\",\n      hour: \"2-digit\",\n      minute: \"2-digit\",\n    });\n  };\n\n  const formatDateShort = (dateStr: string | null) => {\n    if (!dateStr) return \"Unknown date\";\n    return new Date(dateStr).toLocaleDateString(\"en-US\", {\n      month: \"short\",\n      day: \"numeric\",\n      year: \"numeric\",\n    });\n  };\n\n  const formatDuration = (seconds: number | null) => {\n    if (!seconds) return \"\";\n    const mins = Math.floor(seconds / 60);\n    if (mins < 60) return `${mins} min`;\n    const hours = Math.floor(mins / 60);\n    const remainingMins = mins % 60;\n    return `${hours}h ${remainingMins}m`;\n  };\n\n  const [deletingId, setDeletingId] = useState<number | null>(null);\n  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);\n\n  const handleDeleteClick = (e: React.MouseEvent, meetingId: number) => {\n    e.stopPropagation();\n    setConfirmingDeleteId(meetingId);\n  };\n\n  const handleDeleteConfirm = async (e: React.MouseEvent, meetingId: number) => {\n    e.stopPropagation();\n    setDeletingId(meetingId);\n    try {\n      const res = await fetch(`/api/meetings/${meetingId}`, { method: \"DELETE\" });\n      if (!res.ok) throw new Error(\"Failed to delete\");\n      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));\n      setTotalCount((c) => c - 1);\n      setUnfilteredTotal((c) => c - 1);\n    } catch {\n      alert(\"Failed to delete meeting. Please try again.\");\n    } finally {\n      setDeletingId(null);\n      setConfirmingDeleteId(null);\n    }\n  };\n\n  const handleDeleteCancel = (e: React.MouseEvent) => {\n    e.stopPropagation();\n    setConfirmingDeleteId(null);\n  };\n\n  const getActionItems = (meeting: Meeting): string[] => {\n    if (!Array.isArray(meeting.content)) return [];\n    return meeting.content\n      .filter((item): item is KeyPointContent => \"description\" in item)\n      .map((item) => item.description);\n  };\n\n  return (\n    <div className=\"flex h-full flex-col bg-[var(--background)]\">\n      {/* Header with tabs */}\n      <header className=\"sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md\">\n        <div className=\"flex items-center px-6 py-4\">\n          <div>\n            <h1 className=\"text-2xl font-bold text-[var(--foreground)]\">\n              Meetings\n            </h1>\n            <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n              Recorded meetings with key points and action items\n            </p>\n          </div>\n        </div>\n        {/* Tab bar */}\n        <div className=\"flex px-6 gap-1\" role=\"tablist\" aria-label=\"Meeting sections\">\n          <button\n            role=\"tab\"\n            aria-selected={activeTab === \"meetings\"}\n            aria-controls=\"panel-meetings\"\n            id=\"tab-meetings\"\n            onClick={() => setActiveTab(\"meetings\")}\n            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${\n              activeTab === \"meetings\"\n                ? \"border-[var(--primary)] text-[var(--primary)]\"\n                : \"border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]\"\n            }`}\n          >\n            Meetings\n          </button>\n          <button\n            role=\"tab\"\n            aria-selected={activeTab === \"analytics\"}\n            aria-controls=\"panel-analytics\"\n            id=\"tab-analytics\"\n            onClick={() => setActiveTab(\"analytics\")}\n            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${\n              activeTab === \"analytics\"\n                ? \"border-[var(--primary)] text-[var(--primary)]\"\n                : \"border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]\"\n            }`}\n          >\n            Analytics\n          </button>\n        </div>\n      </header>\n\n      {/* Tab panels */}\n      {activeTab === \"meetings\" ? (\n        <main\n          id=\"panel-meetings\"\n          role=\"tabpanel\"\n          aria-labelledby=\"tab-meetings\"\n          className=\"flex-1 overflow-auto px-6 py-8\"\n        >\n          <div className=\"max-w-6xl mx-auto\">\n            {/* Search Form */}\n            <form onSubmit={handleSearch} className=\"mb-6\">\n              <div className=\"flex gap-3\">\n                <input\n                  type=\"text\"\n                  value={query}\n                  onChange={(e) => setQuery(e.target.value)}\n                  placeholder=\"Ask a question about your meetings... (e.g., 'What did we discuss about the budget?')\"\n                  className=\"flex-1 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent\"\n                />\n                <button\n                  type=\"submit\"\n                  disabled={isLoading || !query.trim()}\n                  className=\"px-6 py-3 bg-[var(--primary)] hover:opacity-90 disabled:opacity-50 text-[var(--primary-foreground)] font-medium rounded-lg transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2\"\n                >\n                  {isLoading ? (\n                    <span className=\"flex items-center gap-2\">\n                      <svg className=\"animate-spin h-5 w-5\" viewBox=\"0 0 24 24\">\n                        <circle\n                          className=\"opacity-25\"\n                          cx=\"12\"\n                          cy=\"12\"\n                          r=\"10\"\n                          stroke=\"currentColor\"\n                          strokeWidth=\"4\"\n                          fill=\"none\"\n                        />\n                        <path\n                          className=\"opacity-75\"\n                          fill=\"currentColor\"\n                          d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z\"\n                        />\n                      </svg>\n                      Searching...\n                    </span>\n                  ) : (\n                    \"Search\"\n                  )}\n                </button>\n              </div>\n            </form>\n\n            {/* Error Message */}\n            {error && (\n              <div className=\"mb-6 p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-lg text-[var(--destructive)]\">\n                {error}\n              </div>\n            )}\n\n            {/* Search Results */}\n            {result && (\n              <div className=\"space-y-6 mb-10\">\n                {/* AI Answer */}\n                <div className=\"p-6 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg\">\n                  <div className=\"flex items-start gap-3\">\n                    <div className=\"w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0\">\n                      <svg className=\"w-5 h-5 text-[var(--primary-foreground)]\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n                        <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M13 10V3L4 14h7v7l9-11h-7z\" />\n                      </svg>\n                    </div>\n                    <div>\n                      <h2 className=\"font-medium text-[var(--foreground)] mb-2\">AI Answer</h2>\n                      <p className=\"text-[var(--foreground)]/80 whitespace-pre-wrap\">{result.answer}</p>\n                    </div>\n                  </div>\n                </div>\n\n                {/* Search Result Meeting Cards */}\n                {result.meetings.length > 0 && (\n                  <div>\n                    <h2 className=\"text-lg font-medium text-[var(--foreground)] mb-4\">\n                      Related Meetings ({result.meetings.length})\n                    </h2>\n                    <div className=\"grid gap-4\">\n                      {result.meetings.map((meeting) => (\n                        <div\n                          key={meeting.id}\n                          className={`p-4 bg-[var(--card)] border rounded-lg cursor-pointer transition-all ${\n                            selectedMeeting?.id === meeting.id\n                              ? \"border-[var(--primary)] ring-2 ring-[var(--primary)]\"\n                              : \"border-[var(--border)] hover:border-[var(--muted-foreground)]\"\n                          }`}\n                          onClick={() => setSelectedMeeting(selectedMeeting?.id === meeting.id ? null : meeting)}\n                        >\n                          <div className=\"flex justify-between items-start\">\n                            <div>\n                              <h3 className=\"font-medium text-[var(--foreground)]\">\n                                {meeting.meeting_title || \"Untitled Meeting\"}\n                              </h3>\n                              <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                                {formatDate(meeting.meeting_start_date)}\n                                {meeting.meeting_duration && (\n                                  <span className=\"ml-2\">({formatDuration(meeting.meeting_duration)})</span>\n                                )}\n                              </p>\n                            </div>\n                            <svg\n                              className={`w-5 h-5 text-[var(--muted-foreground)] transition-transform ${\n                                selectedMeeting?.id === meeting.id ? \"rotate-180\" : \"\"\n                              }`}\n                              fill=\"none\"\n                              viewBox=\"0 0 24 24\"\n                              stroke=\"currentColor\"\n                            >\n                              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 9l-7 7-7-7\" />\n                            </svg>\n                          </div>\n\n                          {/* Speakers */}\n                          {Array.isArray(meeting.speakers) && meeting.speakers.length > 0 && (\n                            <div className=\"mt-2 flex flex-wrap gap-2\">\n                              {meeting.speakers.map((speaker, i) => {\n                                const name = typeof speaker === \"string\"\n                                  ? speaker\n                                  : [speaker.first_name, speaker.last_name].filter(Boolean).join(\" \") || `Speaker ${speaker.index}`;\n                                return (\n                                  <span\n                                    key={i}\n                                    className=\"text-xs px-2 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded\"\n                                  >\n                                    {name}\n                                  </span>\n                                );\n                              })}\n                            </div>\n                          )}\n\n                          {/* Expanded Content */}\n                          {selectedMeeting?.id === meeting.id && (\n                            <div className=\"mt-4 pt-4 border-t border-[var(--border)]\">\n                              {/* Key Points */}\n                              {Array.isArray(meeting.content) && meeting.content.length > 0 && (\n                                <div className=\"mb-4\">\n                                  <h4 className=\"text-sm font-medium text-[var(--foreground)] mb-2\">\n                                    Key Points\n                                  </h4>\n                                  <ul className=\"space-y-2\">\n                                    {meeting.content.map((kp, i) => (\n                                      <li\n                                        key={kp.id || i}\n                                        className=\"text-sm text-[var(--muted-foreground)] flex gap-2\"\n                                      >\n                                        <span className=\"text-[var(--primary)]\">&bull;</span>\n                                        {kp.description}\n                                      </li>\n                                    ))}\n                                  </ul>\n                                </div>\n                              )}\n\n                              {/* View Full Transcript button */}\n                              <button\n                                type=\"button\"\n                                onClick={(e) => {\n                                  e.stopPropagation();\n                                  setOpenMeetingId(meeting.id);\n                                }}\n                                className=\"inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity\"\n                              >\n                                <svg className=\"w-4 h-4\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n                                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z\" />\n                                </svg>\n                                View Transcript\n                              </button>\n                            </div>\n                          )}\n                        </div>\n                      ))}\n                    </div>\n                  </div>\n                )}\n              </div>\n            )}\n\n            {/* Recorded Meetings Card Grid */}\n            <div>\n              <h2 className=\"text-lg font-semibold text-[var(--foreground)] mb-4\">\n                Recorded Meetings\n              </h2>\n\n              {/* Filters */}\n              <MeetingFilters\n                filters={filters}\n                onFiltersChange={setFilters}\n                onRemoveFilter={removeFilter}\n                onClearAll={clearAll}\n                hasActiveFilters={hasActiveFilters}\n                totalCount={hasActiveFilters ? unfilteredTotal : totalCount}\n                filteredCount={totalCount}\n                availableParticipants={availableParticipants}\n              />\n\n              {meetingsLoading ? (\n                <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">\n                  {[1, 2, 3].map((i) => (\n                    <div\n                      key={i}\n                      className=\"p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg animate-pulse\"\n                    >\n                      <div className=\"h-5 bg-[var(--secondary)] rounded w-3/4 mb-3\" />\n                      <div className=\"h-3 bg-[var(--secondary)] rounded w-1/2 mb-4\" />\n                      <div className=\"space-y-2\">\n                        <div className=\"h-3 bg-[var(--secondary)] rounded w-full\" />\n                        <div className=\"h-3 bg-[var(--secondary)] rounded w-5/6\" />\n                        <div className=\"h-3 bg-[var(--secondary)] rounded w-4/6\" />\n                      </div>\n                    </div>\n                  ))}\n                </div>\n              ) : meetings.length === 0 ? (\n                <div className=\"text-center py-16\">\n                  {hasActiveFilters ? (\n                    <>\n                      <svg\n                        className=\"w-16 h-16 mx-auto text-[var(--muted-foreground)]/30 mb-4\"\n                        fill=\"none\"\n                        viewBox=\"0 0 24 24\"\n                        stroke=\"currentColor\"\n                      >\n                        <path\n                          strokeLinecap=\"round\"\n                          strokeLinejoin=\"round\"\n                          strokeWidth={1.5}\n                          d=\"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z\"\n                        />\n                      </svg>\n                      <h3 className=\"text-xl font-medium text-[var(--foreground)] mb-2\">\n                        No Matching Meetings\n                      </h3>\n                      <p className=\"text-[var(--muted-foreground)] max-w-md mx-auto mb-4\">\n                        No meetings match your current filters. Try adjusting or clearing your filters.\n                      </p>\n                      <button\n                        type=\"button\"\n                        onClick={clearAll}\n                        className=\"px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity\"\n                      >\n                        Clear All Filters\n                      </button>\n                    </>\n                  ) : (\n                    <>\n                      <svg\n                        className=\"w-16 h-16 mx-auto text-[var(--muted-foreground)]/30 mb-4\"\n                        fill=\"none\"\n                        viewBox=\"0 0 24 24\"\n                        stroke=\"currentColor\"\n                      >\n                        <path\n                          strokeLinecap=\"round\"\n                          strokeLinejoin=\"round\"\n                          strokeWidth={1.5}\n                          d=\"M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z\"\n                        />\n                      </svg>\n                      <h3 className=\"text-xl font-medium text-[var(--foreground)] mb-2\">\n                        No Meetings Yet\n                      </h3>\n                      <p className=\"text-[var(--muted-foreground)] max-w-md mx-auto\">\n                        Meetings will appear here once Krisp sends webhook data. Use the search bar above to query your meeting transcripts.\n                      </p>\n                    </>\n                  )}\n                </div>\n              ) : (\n                <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">\n                  {meetings.map((meeting) => {\n                    const actionItems = getActionItems(meeting);\n                    return (\n                      <div\n                        key={meeting.id}\n                        onClick={() => setOpenMeetingId(meeting.id)}\n                        className=\"group relative p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:border-[var(--muted-foreground)] transition-colors flex flex-col cursor-pointer\"\n                      >\n                        {/* Delete confirmation overlay */}\n                        {confirmingDeleteId === meeting.id && (\n                          <div\n                            className=\"absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-[var(--card)]/95 backdrop-blur-sm border border-[var(--destructive)]/30\"\n                            onClick={(e) => e.stopPropagation()}\n                          >\n                            <p className=\"text-sm font-medium text-[var(--foreground)]\">Delete this meeting?</p>\n                            <div className=\"flex gap-2\">\n                              <button\n                                type=\"button\"\n                                onClick={(e) => handleDeleteConfirm(e, meeting.id)}\n                                disabled={deletingId === meeting.id}\n                                className=\"px-4 py-1.5 text-sm font-medium rounded-md bg-[var(--destructive)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5\"\n                              >\n                                {deletingId === meeting.id ? (\n                                  <>\n                                    <svg className=\"w-3.5 h-3.5 animate-spin\" viewBox=\"0 0 24 24\" fill=\"none\">\n                                      <circle className=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" strokeWidth=\"4\" />\n                                      <path className=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z\" />\n                                    </svg>\n                                    Deleting...\n                                  </>\n                                ) : (\n                                  \"Delete\"\n                                )}\n                              </button>\n                              <button\n                                type=\"button\"\n                                onClick={handleDeleteCancel}\n                                disabled={deletingId === meeting.id}\n                                className=\"px-4 py-1.5 text-sm font-medium rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors\"\n                              >\n                                Cancel\n                              </button>\n                            </div>\n                          </div>\n                        )}\n\n                        {/* Delete button */}\n                        <button\n                          type=\"button\"\n                          onClick={(e) => handleDeleteClick(e, meeting.id)}\n                          className=\"absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[var(--destructive)]/10 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-all\"\n                          title=\"Delete meeting\"\n                        >\n                          <svg className=\"w-4 h-4\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n                            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16\" />\n                          </svg>\n                        </button>\n\n                        {/* Title */}\n                        <h3 className=\"font-medium text-[var(--foreground)] leading-snug line-clamp-2 pr-8\">\n                          {meeting.meeting_title || \"Untitled Meeting\"}\n                        </h3>\n\n                        {/* Date & Duration */}\n                        <div className=\"flex items-center gap-2 mt-2 text-xs text-[var(--muted-foreground)]\">\n                          <span>{formatDateShort(meeting.meeting_start_date)}</span>\n                          {meeting.meeting_duration && (\n                            <>\n                              <span className=\"text-[var(--border)]\">|</span>\n                              <span>{formatDuration(meeting.meeting_duration)}</span>\n                            </>\n                          )}\n                        </div>\n\n                        {/* Action Items / Key Points */}\n                        {actionItems.length > 0 ? (\n                          <ul className=\"mt-3 space-y-1.5 flex-1\">\n                            {actionItems.slice(0, 4).map((item, i) => (\n                              <li\n                                key={i}\n                                className=\"text-sm text-[var(--muted-foreground)] flex gap-2 leading-snug\"\n                              >\n                                <svg\n                                  className=\"w-4 h-4 text-[var(--primary)] flex-shrink-0 mt-0.5\"\n                                  fill=\"none\"\n                                  viewBox=\"0 0 24 24\"\n                                  stroke=\"currentColor\"\n                                >\n                                  <path\n                                    strokeLinecap=\"round\"\n                                    strokeLinejoin=\"round\"\n                                    strokeWidth={2}\n                                    d=\"M9 5l7 7-7 7\"\n                                  />\n                                </svg>\n                                <span className=\"line-clamp-2\">{item}</span>\n                              </li>\n                            ))}\n                            {actionItems.length > 4 && (\n                              <li className=\"text-xs text-[var(--muted-foreground)] pl-6\">\n                                +{actionItems.length - 4} more\n                              </li>\n                            )}\n                          </ul>\n                        ) : (\n                          <p className=\"mt-3 text-sm text-[var(--muted-foreground)]/60 italic flex-1\">\n                            No action items recorded\n                          </p>\n                        )}\n\n                        {/* Speakers */}\n                        {Array.isArray(meeting.speakers) && meeting.speakers.length > 0 && (\n                          <div className=\"mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap gap-1.5\">\n                            {meeting.speakers.slice(0, 3).map((speaker, i) => {\n                              const name = typeof speaker === \"string\"\n                                ? speaker\n                                : [speaker.first_name, speaker.last_name].filter(Boolean).join(\" \") || `Speaker ${speaker.index}`;\n                              return (\n                                <span\n                                  key={i}\n                                  className=\"text-xs px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded\"\n                                >\n                                  {name}\n                                </span>\n                              );\n                            })}\n                            {meeting.speakers.length > 3 && (\n                              <span className=\"text-xs px-2 py-0.5 text-[var(--muted-foreground)]\">\n                                +{meeting.speakers.length - 3}\n                              </span>\n                            )}\n                          </div>\n                        )}\n                      </div>\n                    );\n                  })}\n                </div>\n              )}\n            </div>\n          </div>\n        </main>\n      ) : (\n        <main\n          id=\"panel-analytics\"\n          role=\"tabpanel\"\n          aria-labelledby=\"tab-analytics\"\n          className=\"flex-1 overflow-auto px-6 py-8\"\n        >\n          <AnalyticsDashboard />\n        </main>\n      )}\n\n      <MeetingDetailDrawer\n        meetingId={openMeetingId}\n        onClose={() => setOpenMeetingId(null)}\n      />\n    </div>\n  );\n}\n\nexport default function KrispPage() {\n  return (\n    <Suspense fallback={\n      <div className=\"flex h-full flex-col bg-[var(--background)]\">\n        <header className=\"sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md\">\n          <div className=\"flex items-center px-6 py-4\">\n            <div>\n              <h1 className=\"text-2xl font-bold text-[var(--foreground)]\">Meetings</h1>\n              <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                Recorded meetings with key points and action items\n              </p>\n            </div>\n          </div>\n        </header>\n        <main className=\"flex-1 overflow-auto px-6 py-8\">\n          <div className=\"max-w-6xl mx-auto\">\n            <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">\n              {[1, 2, 3].map((i) => (\n                <div key={i} className=\"p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg animate-pulse\">\n                  <div className=\"h-5 bg-[var(--secondary)] rounded w-3/4 mb-3\" />\n                  <div className=\"h-3 bg-[var(--secondary)] rounded w-1/2 mb-4\" />\n                  <div className=\"space-y-2\">\n                    <div className=\"h-3 bg-[var(--secondary)] rounded w-full\" />\n                    <div className=\"h-3 bg-[var(--secondary)] rounded w-5/6\" />\n                  </div>\n                </div>\n              ))}\n            </div>\n          </div>\n        </main>\n      </div>\n    }>\n      <KrispPageInner />\n    </Suspense>\n  );\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Analytics, Meetings, and navigation structure",
      "status": "completed",
      "activeForm": "Exploring existing codebase structure"
    },
    {
      "content": "Plan implementation approach",
      "status": "completed",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Remove Analytics from sidebar navigation",
      "status": "completed",
      "activeForm": "Removing Analytics from sidebar navigation"
    },
    {
      "content": "Add tabbed layout to Meetings page (Meetings + Analytics tabs)",
      "status": "completed",
      "activeForm": "Adding tabbed layout to Meetings page"
    },
    {
      "content": "Merge meeting breakdown into Meeting Detail page",
      "status": "in_progress",
      "activeForm": "Merging meeting breakdown into Meeting Detail page"
    },
    {
      "content": "Add redirect from old Analytics route to Meetings?tab=analytics",
      "status": "pending",
      "activeForm": "Adding redirect from old Analytics route"
    },
    {
      "content": "Clean up orphaned code and verify no broken links",
      "status": "pending",
      "activeForm": "Cleaning up orphaned code"
    }
  ]
}
Now, regarding the "Meeting Breakdown — Merge Into Meeting Detail Page" requirement. Looking at the codebase:

- The analytics page has a "Meeting Breakdown" section that shows per-meeting analytics (sentiment, talk-time, engagement) in expandable rows
- The MeetingDetailDrawer already shows transcript, key points, and action items for individual meetings

The requirement says to integrate the meeting breakdown content into the individual Meeting Detail page. Let me add the per-meeting analytics data (sentiment, talk-time, engagement) into the MeetingDetailDrawer. Let me read the full drawer component first.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\meeting\\MeetingDetailDrawer.tsx"
}
Now I see the MeetingDetailDrawer already has the full meeting details (transcript, key points, action items) in a tabbed interface. The "meeting breakdown" from the analytics page shows per-meeting analytics (sentiment, talk-time, engagement). I need to add an "Analytics" tab to the MeetingDetailDrawer that shows the per-meeting analytics data.

Let me check what API is available for per-meeting analytics.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\krisp\\analytics.ts",
  "limit": 30
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\analytics\\route.ts"
}
Let me check the `analyzeOneMeeting` function to understand what it needs.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\krisp\\analytics.ts",
  "offset": 30
}
Now I understand the full picture. The `analyzeOneMeeting` function computes sentiment, talk-time, and engagement per meeting. I need to:

1. Export `analyzeOneMeeting` so I can create a per-meeting analytics API
2. Create an API route to get analytics for a single meeting  
3. Add an "Analytics" tab to the MeetingDetailDrawer

Let me do this step by step. First, I'll export the helper and create a new API endpoint for single-meeting analytics.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\krisp\\analytics.ts",
  "old_string": "function analyzeOneMeeting(row: WebhookKeyPointsRow): MeetingAnalytics {",
  "new_string": "export function analyzeOneMeeting(row: WebhookKeyPointsRow): MeetingAnalytics {"
}
Now create the per-meeting analytics API endpoint.

🔧 Tool: Bash
Input: {
  "command": "ls \"C:\\Code\\Krisp\\app\\api\\meetings\\[id]\"",
  "description": "List existing meeting API route files"
}
Let me check the existing meeting API route to understand the pattern used.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\meetings\\[id]\\route.ts"
}
Now I need to check `getMeetingById` to see what data format it returns, so I can understand if I can pass it to `analyzeOneMeeting`.

🔧 Tool: Grep
Input: {
  "pattern": "export async function getMeetingById",
  "path": "C:\\Code\\Krisp\\lib\\krisp\\webhookKeyPoints.ts",
  "output_mode": "content",
  "-A": 30
}
`getMeetingById` returns a `WebhookKeyPointsRow`, which is exactly what `analyzeOneMeeting` expects. Now I can create the per-meeting analytics API route.

🔧 Tool: Bash
Input: {
  "command": "mkdir -p \"C:\\Code\\Krisp\\app\\api\\meetings\\[id]\\analytics\"",
  "description": "Create analytics route directory"
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\meetings\\[id]\\analytics\\route.ts",
  "content": "import { NextResponse } from \"next/server\";\nimport { auth } from \"@/lib/auth/server\";\nimport { getMeetingById } from \"@/lib/krisp/webhookKeyPoints\";\nimport { analyzeOneMeeting } from \"@/lib/krisp/analytics\";\n\nexport async function GET(\n  _request: Request,\n  { params }: { params: Promise<{ id: string }> }\n) {\n  try {\n    const { data: session } = await auth.getSession();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const { id } = await params;\n    const meetingId = parseInt(id, 10);\n    if (isNaN(meetingId)) {\n      return NextResponse.json({ error: \"Invalid meeting ID\" }, { status: 400 });\n    }\n\n    const meeting = await getMeetingById(meetingId, userId);\n    if (!meeting) {\n      return NextResponse.json({ error: \"Meeting not found\" }, { status: 404 });\n    }\n\n    const analytics = analyzeOneMeeting(meeting);\n    return NextResponse.json(analytics);\n  } catch (error) {\n    console.error(\"Error fetching meeting analytics:\", error);\n    return NextResponse.json(\n      { error: \"Failed to fetch meeting analytics\" },\n      { status: 500 }\n    );\n  }\n}\n"
}
Now I need to add an "Analytics" tab to the MeetingDetailDrawer. Let me add the analytics tab with inline chart helpers (keeping them lightweight since they'll only render for one meeting).

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\analytics.ts"
}
Now I'll add the "Analytics" tab to the MeetingDetailDrawer. I need to:
1. Add the `MeetingAnalytics` type import
2. Add state for per-meeting analytics data
3. Add a fetch call when meetingId changes
4. Add the "Analytics" tab button
5. Add the analytics tab panel content

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\components\\meeting\\MeetingDetailDrawer.tsx",
  "old_string": "import React, { useCallback, useEffect, useMemo, useState } from \"react\";\nimport { Drawer } from \"@/components/ui/Drawer\";\nimport type { ActionItem, Board, Column } from \"@/types\";",
  "new_string": "import React, { useCallback, useEffect, useMemo, useState } from \"react\";\nimport { Drawer } from \"@/components/ui/Drawer\";\nimport type { ActionItem, Board, Column } from \"@/types\";\nimport type { MeetingAnalytics } from \"@/types/analytics\";"
}
Now add the analytics state and tab type update.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\components\\meeting\\MeetingDetailDrawer.tsx",
  "old_string": "  const [activeTab, setActiveTab] = useState<\"transcript\" | \"key-points\" | \"action-items\">(\"transcript\");\n  const [hasAutoSwitchedTab, setHasAutoSwitchedTab] = useState(false);",
  "new_string": "  const [activeTab, setActiveTab] = useState<\"transcript\" | \"key-points\" | \"action-items\" | \"analytics\">(\"transcript\");\n  const [hasAutoSwitchedTab, setHasAutoSwitchedTab] = useState(false);\n\n  // Per-meeting analytics state\n  const [meetingAnalytics, setMeetingAnalytics] = useState<MeetingAnalytics | null>(null);\n  const [analyticsLoading, setAnalyticsLoading] = useState(false);"
}
Now add the analytics fetch in the useEffect that fires when meetingId changes. I need to find the right spot.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\components\\meeting\\MeetingDetailDrawer.tsx",
  "old_string": "    if (!meetingId) {\n      setMeeting(null);\n      setMeetingActionItems([]);\n      setActiveTab(\"transcript\");\n      setFilteredSpeaker(null);\n      return;\n    }",
  "new_string": "    if (!meetingId) {\n      setMeeting(null);\n      setMeetingActionItems([]);\n      setMeetingAnalytics(null);\n      setActiveTab(\"transcript\");\n      setFilteredSpeaker(null);\n      return;\n    }"
}
Now add the analytics fetch alongside the existing action items fetch.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\components\\meeting\\MeetingDetailDrawer.tsx",
  "old_string": "    // Fetch action items for this meeting\n    setActionItemsLoading(true);\n    setHasAutoSwitchedTab(false);",
  "new_string": "    // Fetch per-meeting analytics\n    setAnalyticsLoading(true);\n    fetch(`/api/meetings/${meetingId}/analytics`)\n      .then((res) => (res.ok ? res.json() : Promise.reject()))\n      .then((data) => setMeetingAnalytics(data))\n      .catch(() => setMeetingAnalytics(null))\n      .finally(() => setAnalyticsLoading(false));\n\n    // Fetch action items for this meeting\n    setActionItemsLoading(true);\n    setHasAutoSwitchedTab(false);"
}
Now add the "Analytics" tab button in the tab bar.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\components\\meeting\\MeetingDetailDrawer.tsx",
  "old_string": "              Action Items{meetingActionItems.length > 0 ? ` (${meetingActionItems.length})` : \"\"}\n            </button>\n          </div>",
  "new_string": "              Action Items{meetingActionItems.length > 0 ? ` (${meetingActionItems.length})` : \"\"}\n            </button>\n            <button\n              type=\"button\"\n              onClick={() => setActiveTab(\"analytics\")}\n              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${\n                activeTab === \"analytics\"\n                  ? \"border-[var(--primary)] text-[var(--foreground)]\"\n                  : \"border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]\"\n              }`}\n            >\n              Analytics\n            </button>\n          </div>"
}
Now I need to add the Analytics tab panel content. I'll add it after the action-items tab panel. Let me find the right location.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\meeting\\MeetingDetailDrawer.tsx",
  "offset": 845,
  "limit": 140
}
I need to change the tab content rendering logic. Currently it's `activeTab === "transcript" ? ... : activeTab === "key-points" ? ... : (action-items)`. I need to change the last `else` to explicitly check for `action-items` and add a new `analytics` branch.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\components\\meeting\\MeetingDetailDrawer.tsx",
  "old_string": "          ) : activeTab === \"key-points\" ? (\n            <div className=\"space-y-2\">\n              {keyPoints.length > 0 ? (\n                keyPoints.map((kp, i) => (\n                  <div\n                    key={kp.id || i}\n                    className=\"flex gap-3 p-3 rounded-lg bg-[var(--secondary)]/50\"\n                  >\n                    <span className=\"text-[var(--primary)] font-medium text-sm mt-0.5 flex-shrink-0\">\n                      {i + 1}.\n                    </span>\n                    <p className=\"text-sm text-[var(--foreground)] leading-relaxed\">\n                      {kp.description}\n                    </p>\n                  </div>\n                ))\n              ) : (\n                <p className=\"text-sm text-[var(--muted-foreground)] italic py-4 text-center\">\n                  No key points recorded for this meeting\n                </p>\n              )}\n            </div>\n          ) : (\n            <div className=\"space-y-2\">",
  "new_string": "          ) : activeTab === \"key-points\" ? (\n            <div className=\"space-y-2\">\n              {keyPoints.length > 0 ? (\n                keyPoints.map((kp, i) => (\n                  <div\n                    key={kp.id || i}\n                    className=\"flex gap-3 p-3 rounded-lg bg-[var(--secondary)]/50\"\n                  >\n                    <span className=\"text-[var(--primary)] font-medium text-sm mt-0.5 flex-shrink-0\">\n                      {i + 1}.\n                    </span>\n                    <p className=\"text-sm text-[var(--foreground)] leading-relaxed\">\n                      {kp.description}\n                    </p>\n                  </div>\n                ))\n              ) : (\n                <p className=\"text-sm text-[var(--muted-foreground)] italic py-4 text-center\">\n                  No key points recorded for this meeting\n                </p>\n              )}\n            </div>\n          ) : activeTab === \"analytics\" ? (\n            <div className=\"space-y-4\">\n              {analyticsLoading ? (\n                <div className=\"space-y-4 animate-pulse py-2\">\n                  <div className=\"grid grid-cols-3 gap-3\">\n                    {[1, 2, 3].map((i) => (\n                      <div key={i} className=\"p-4 bg-[var(--secondary)]/50 rounded-lg\">\n                        <div className=\"h-4 bg-[var(--secondary)] rounded w-1/2 mb-2\" />\n                        <div className=\"h-6 bg-[var(--secondary)] rounded w-3/4\" />\n                      </div>\n                    ))}\n                  </div>\n                </div>\n              ) : meetingAnalytics ? (\n                <>\n                  {/* Sentiment */}\n                  <div className=\"p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg\">\n                    <h4 className=\"text-xs font-medium text-[var(--muted-foreground)] mb-3\">Sentiment Breakdown</h4>\n                    <div className=\"flex items-center gap-4\">\n                      <div className=\"flex-shrink-0\">\n                        <span className={`text-lg font-bold ${\n                          meetingAnalytics.sentiment.overall > 0.15\n                            ? \"text-emerald-500\"\n                            : meetingAnalytics.sentiment.overall < -0.15\n                              ? \"text-red-500\"\n                              : \"text-[var(--muted-foreground)]\"\n                        }`}>\n                          {meetingAnalytics.sentiment.overall > 0.15\n                            ? \"Positive\"\n                            : meetingAnalytics.sentiment.overall < -0.15\n                              ? \"Negative\"\n                              : \"Neutral\"}\n                        </span>\n                      </div>\n                      <div className=\"flex-1 space-y-1.5\">\n                        <div className=\"flex items-center gap-2\">\n                          <span className=\"w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0\" />\n                          <span className=\"text-xs text-[var(--muted-foreground)] w-16\">Positive</span>\n                          <div className=\"flex-1 h-2 rounded-full bg-[var(--secondary)]\">\n                            <div className=\"h-2 rounded-full bg-emerald-500 transition-all\" style={{ width: `${Math.round(meetingAnalytics.sentiment.positive * 100)}%` }} />\n                          </div>\n                          <span className=\"text-xs text-[var(--foreground)] w-10 text-right\">{Math.round(meetingAnalytics.sentiment.positive * 100)}%</span>\n                        </div>\n                        <div className=\"flex items-center gap-2\">\n                          <span className=\"w-2 h-2 rounded-full bg-slate-400 flex-shrink-0\" />\n                          <span className=\"text-xs text-[var(--muted-foreground)] w-16\">Neutral</span>\n                          <div className=\"flex-1 h-2 rounded-full bg-[var(--secondary)]\">\n                            <div className=\"h-2 rounded-full bg-slate-400 transition-all\" style={{ width: `${Math.round(meetingAnalytics.sentiment.neutral * 100)}%` }} />\n                          </div>\n                          <span className=\"text-xs text-[var(--foreground)] w-10 text-right\">{Math.round(meetingAnalytics.sentiment.neutral * 100)}%</span>\n                        </div>\n                        <div className=\"flex items-center gap-2\">\n                          <span className=\"w-2 h-2 rounded-full bg-red-500 flex-shrink-0\" />\n                          <span className=\"text-xs text-[var(--muted-foreground)] w-16\">Negative</span>\n                          <div className=\"flex-1 h-2 rounded-full bg-[var(--secondary)]\">\n                            <div className=\"h-2 rounded-full bg-red-500 transition-all\" style={{ width: `${Math.round(meetingAnalytics.sentiment.negative * 100)}%` }} />\n                          </div>\n                          <span className=\"text-xs text-[var(--foreground)] w-10 text-right\">{Math.round(meetingAnalytics.sentiment.negative * 100)}%</span>\n                        </div>\n                      </div>\n                    </div>\n                  </div>\n\n                  {/* Talk-Time Distribution */}\n                  <div className=\"p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg\">\n                    <h4 className=\"text-xs font-medium text-[var(--muted-foreground)] mb-3\">Talk-Time Distribution</h4>\n                    {meetingAnalytics.talkTime.length > 0 ? (\n                      <div className=\"space-y-2\">\n                        {meetingAnalytics.talkTime.map((s, i) => {\n                          const barColors = [\"#6366f1\", \"#f59e0b\", \"#10b981\", \"#ef4444\", \"#8b5cf6\", \"#ec4899\", \"#14b8a6\", \"#f97316\"];\n                          return (\n                            <div key={s.speaker} className=\"flex items-center gap-3\">\n                              <div className=\"w-24 text-xs text-[var(--foreground)] truncate\" title={s.speaker}>\n                                {s.speaker}\n                              </div>\n                              <div className=\"flex-1 h-2 rounded-full bg-[var(--secondary)]\">\n                                <div\n                                  className=\"h-2 rounded-full transition-all\"\n                                  style={{ width: `${s.percentage}%`, backgroundColor: barColors[i % barColors.length] }}\n                                />\n                              </div>\n                              <div className=\"w-20 text-xs text-[var(--muted-foreground)] text-right\">\n                                {s.percentage}% ({s.wordCount})\n                              </div>\n                            </div>\n                          );\n                        })}\n                      </div>\n                    ) : (\n                      <p className=\"text-sm text-[var(--muted-foreground)]\">No speaker data</p>\n                    )}\n                  </div>\n\n                  {/* Engagement Score */}\n                  <div className=\"p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg\">\n                    <h4 className=\"text-xs font-medium text-[var(--muted-foreground)] mb-3\">Engagement Score</h4>\n                    <div className=\"flex items-center gap-4 mb-4\">\n                      <div className={`text-3xl font-bold ${\n                        meetingAnalytics.engagement.score >= 70\n                          ? \"text-emerald-500\"\n                          : meetingAnalytics.engagement.score >= 40\n                            ? \"text-amber-500\"\n                            : \"text-red-500\"\n                      }`}>\n                        {meetingAnalytics.engagement.score}\n                      </div>\n                      <span className=\"text-sm text-[var(--muted-foreground)]\">/ 100</span>\n                    </div>\n                    <div className=\"space-y-2\">\n                      <div>\n                        <div className=\"flex justify-between text-xs mb-0.5\">\n                          <span className=\"text-[var(--muted-foreground)]\">Participant Balance</span>\n                          <span className=\"text-[var(--foreground)]\">{meetingAnalytics.engagement.factors.participantBalance}</span>\n                        </div>\n                        <div className=\"h-2 rounded-full bg-[var(--secondary)]\">\n                          <div className=\"h-2 rounded-full bg-indigo-500 transition-all\" style={{ width: `${meetingAnalytics.engagement.factors.participantBalance}%` }} />\n                        </div>\n                      </div>\n                      <div>\n                        <div className=\"flex justify-between text-xs mb-0.5\">\n                          <span className=\"text-[var(--muted-foreground)]\">Key Points Density</span>\n                          <span className=\"text-[var(--foreground)]\">{meetingAnalytics.engagement.factors.keyPointsDensity}</span>\n                        </div>\n                        <div className=\"h-2 rounded-full bg-[var(--secondary)]\">\n                          <div className=\"h-2 rounded-full bg-amber-500 transition-all\" style={{ width: `${meetingAnalytics.engagement.factors.keyPointsDensity}%` }} />\n                        </div>\n                      </div>\n                      <div>\n                        <div className=\"flex justify-between text-xs mb-0.5\">\n                          <span className=\"text-[var(--muted-foreground)]\">Duration Score</span>\n                          <span className=\"text-[var(--foreground)]\">{meetingAnalytics.engagement.factors.duration}</span>\n                        </div>\n                        <div className=\"h-2 rounded-full bg-[var(--secondary)]\">\n                          <div className=\"h-2 rounded-full bg-emerald-500 transition-all\" style={{ width: `${meetingAnalytics.engagement.factors.duration}%` }} />\n                        </div>\n                      </div>\n                    </div>\n                    <div className=\"mt-3 text-xs text-[var(--muted-foreground)]\">\n                      {meetingAnalytics.keyPointsCount} key point{meetingAnalytics.keyPointsCount !== 1 ? \"s\" : \"\"} &middot; {meetingAnalytics.participantCount} participant{meetingAnalytics.participantCount !== 1 ? \"s\" : \"\"}\n                    </div>\n                  </div>\n                </>\n              ) : (\n                <div className=\"text-center py-6\">\n                  <p className=\"text-sm text-[var(--muted-foreground)]\">\n                    No analytics data available for this meeting\n                  </p>\n                </div>\n              )}\n            </div>\n          ) : (\n            <div className=\"space-y-2\">"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Analytics, Meetings, and navigation structure",
      "status": "completed",
      "activeForm": "Exploring existing codebase structure"
    },
    {
      "content": "Plan implementation approach",
      "status": "completed",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Remove Analytics from sidebar navigation",
      "status": "completed",
      "activeForm": "Removing Analytics from sidebar navigation"
    },
    {
      "content": "Add tabbed layout to Meetings page (Meetings + Analytics tabs)",
      "status": "completed",
      "activeForm": "Adding tabbed layout to Meetings page"
    },
    {
      "content": "Merge meeting breakdown into Meeting Detail page",
      "status": "completed",
      "activeForm": "Merging meeting breakdown into Meeting Detail page"
    },
    {
      "content": "Add redirect from old Analytics route to Meetings?tab=analytics",
      "status": "in_progress",
      "activeForm": "Adding redirect from old Analytics route"
    },
    {
      "content": "Clean up orphaned code and verify no broken links",
      "status": "pending",
      "activeForm": "Cleaning up orphaned code"
    }
  ]
}
Now let me replace the old analytics page with a redirect to `/krisp?tab=analytics`.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\analytics\\page.tsx",
  "content": "import { redirect } from \"next/navigation\";\n\nexport default function AnalyticsPage() {\n  redirect(\"/krisp?tab=analytics\");\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Analytics, Meetings, and navigation structure",
      "status": "completed",
      "activeForm": "Exploring existing codebase structure"
    },
    {
      "content": "Plan implementation approach",
      "status": "completed",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Remove Analytics from sidebar navigation",
      "status": "completed",
      "activeForm": "Removing Analytics from sidebar navigation"
    },
    {
      "content": "Add tabbed layout to Meetings page (Meetings + Analytics tabs)",
      "status": "completed",
      "activeForm": "Adding tabbed layout to Meetings page"
    },
    {
      "content": "Merge meeting breakdown into Meeting Detail page",
      "status": "completed",
      "activeForm": "Merging meeting breakdown into Meeting Detail page"
    },
    {
      "content": "Add redirect from old Analytics route to Meetings?tab=analytics",
      "status": "completed",
      "activeForm": "Adding redirect from old Analytics route"
    },
    {
      "content": "Clean up orphaned code and verify no broken links",
      "status": "in_progress",
      "activeForm": "Cleaning up orphaned code"
    }
  ]
}
Now let me do the final cleanup check. Let me verify there are no remaining references to the old analytics page or broken links.

🔧 Tool: Task
Input: {
  "description": "Search for analytics references",
  "prompt": "Search the codebase for any remaining references to the \"/analytics\" route (as a standalone path, not as part of /api/analytics or /meetings/[id]/analytics) that might be broken links. Look for:\n1. Any href=\"/analytics\" or Link to \"/analytics\" in components other than SideNav, MobileBottomNav, and the analytics redirect page\n2. Any router.push(\"/analytics\") or redirect(\"/analytics\") \n3. References in CommandPalette.tsx or other navigation components\n4. References in shortcut registry (already updated, but verify)\n\nDo NOT count:\n- The /api/analytics API route (that stays)\n- The redirect page at app/(app)/analytics/page.tsx\n- The shortcut registry entry that now points to /krisp?tab=analytics\n\nReport back what you find.",
  "subagent_type": "Explore",
  "model": "haiku"
}

🔧 Tool: Grep
Input: {
  "pattern": "href=[\"']/analytics[\"']",
  "output_mode": "content"
}

🔧 Tool: Grep
Input: {
  "pattern": "router\\.push\\([\"']/analytics[\"']\\)",
  "output_mode": "content"
}

🔧 Tool: Grep
Input: {
  "pattern": "redirect\\([\"']/analytics[\"']\\)",
  "output_mode": "content"
}

🔧 Tool: Grep
Input: {
  "pattern": "path:\\s*[\"']/analytics[\"']",
  "output_mode": "content"
}

🔧 Tool: Grep
Input: {
  "pattern": "\\[\"/analytics\"\\]",
  "output_mode": "content"
}

🔧 Tool: Grep
Input: {
  "pattern": "Link.*analytics",
  "output_mode": "content"
}

🔧 Tool: Grep
Input: {
  "pattern": "/analytics",
  "output_mode": "files_with_matches"
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && grep -r \"CommandPalette\" --include=\"*.tsx\" --include=\"*.ts\" | head -20"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\CommandPalette.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\SideNav.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/shortcuts/**"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\shortcuts\\registry.ts"
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && grep -r \"analytics\" --include=\"*.tsx\" --include=\"*.ts\" -i | grep -E \"(href|router\\.push|redirect|navigate)\" | grep -v \"/api/\" | grep -v \".automaker\" | head -30"
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && find app components lib -type f \\( -name \"*.tsx\" -o -name \"*.ts\" \\) -exec grep -l \"\\.push\\|href=\" {} \\; | xargs grep -l \"analytics\" 2>/dev/null | grep -v automaker"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\krisp\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\dashboard\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\meeting\\MeetingDetailDrawer.tsx",
  "limit": 100
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && git log --oneline --all -20 | head -20"
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && find . -type f \\( -name \"*.tsx\" -o -name \"*.ts\" \\) ! -path \"./.automaker/*\" ! -path \"./.next/*\" -exec grep -l \"analytics\" {} \\; | sort"
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && grep -r \"tab=analytics\" --include=\"*.tsx\" --include=\"*.ts\" | grep -v \".automaker\""
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\analytics\\page.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && grep -r '\"/analytics\"' --include=\"*.tsx\" --include=\"*.ts\" | grep -v \".automaker\" | grep -v \"node_modules\""
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && find app components lib -type f \\( -name \"*.tsx\" -o -name \"*.ts\" \\) -exec grep -l \"/analytics\" {} \\;"
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && grep \"/analytics\" app/api/analytics/route.ts app/api/meetings/*/analytics/route.ts components/meeting/AnalyticsDashboard.tsx lib/krisp/analytics.ts | grep -E \"(href|router\\.push|redirect|navigate)\" || echo \"No broken references found in these files\""
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && grep -r 'href.*\"/analytics' app components lib --include=\"*.tsx\" --include=\"*.ts\" 2>/dev/null || echo \"No href=/analytics found\""
}
All clean. Now let me also check that the `MobileBottomNav.tsx` still has its `AnalyticsMoreIcon` function defined (even though it's no longer used in the nav items array), and verify no now-unused icon components exist that I should remove.

🔧 Tool: Grep
Input: {
  "pattern": "AnalyticsMoreIcon|AnalyticsIcon",
  "path": "C:\\Code\\Krisp\\components\\ui",
  "output_mode": "content"
}
The `AnalyticsMoreIcon` and `AnalyticsIcon` functions are defined but no longer referenced in the nav arrays. Let me remove them.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\components\\ui\\MobileBottomNav.tsx",
  "old_string": "function AnalyticsMoreIcon({ size = 22 }: { size?: number }) {\n  return (\n    <svg width={size} height={size} viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"1.8\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n      <path d=\"M3 3v18h18\" />\n      <path d=\"m19 9-5 5-4-4-3 3\" />\n    </svg>\n  );\n}\n\nfunction ActivityMoreIcon",
  "new_string": "function ActivityMoreIcon"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\components\\ui\\SideNav.tsx",
  "old_string": "function AnalyticsIcon({ size = 20 }: { size?: number }) {\n  return (\n    <svg\n      xmlns=\"http://www.w3.org/2000/svg\"\n      width={size}\n      height={size}\n      viewBox=\"0 0 24 24\"\n      fill=\"none\"\n      stroke=\"currentColor\"\n      strokeWidth=\"2\"\n      strokeLinecap=\"round\"\n      strokeLinejoin=\"round\"\n    >\n      <path d=\"M3 3v18h18\" />\n      <path d=\"m19 9-5 5-4-4-3 3\" />\n    </svg>\n  );\n}\n\nfunction ActivityFeedIcon",
  "new_string": "function ActivityFeedIcon"
}
Now let me also update the `isActive` function in SideNav to handle the `/krisp` route checking for the analytics tab as well.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\SideNav.tsx",
  "offset": 630,
  "limit": 20
}
The `isActive` for `/krisp` currently checks `pathname === "/krisp"` which is an exact match. Since the analytics tab uses URL query params (`?tab=analytics`), the pathname is still `/krisp`, so the "Meetings" sidebar item will correctly highlight when on either tab. That's correct behavior.

Now let me verify the build compiles correctly.

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx tsc --noEmit --pretty 2>&1 | head -80",
  "description": "TypeScript type check",
  "timeout": 120000
}
The type check is running. Let me wait for it.

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx tsc --noEmit --pretty 2>&1 | tail -40",
  "description": "TypeScript type check - wait for results",
  "timeout": 180000
}
TypeScript compilation passed with no errors. Let me also do a quick check that the `sql` import in the new analytics route will work correctly.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\krisp\\analytics.ts",
  "limit": 3
}
Good - the analytics module imports `sql` from its local db module, and `analyzeOneMeeting` is a pure function that doesn't need `sql` — it takes a `WebhookKeyPointsRow` and returns `MeetingAnalytics`. The new API route uses `getMeetingById` to fetch the row and passes it to `analyzeOneMeeting`, so there are no unused imports.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Analytics, Meetings, and navigation structure",
      "status": "completed",
      "activeForm": "Exploring existing codebase structure"
    },
    {
      "content": "Plan implementation approach",
      "status": "completed",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Remove Analytics from sidebar navigation",
      "status": "completed",
      "activeForm": "Removing Analytics from sidebar navigation"
    },
    {
      "content": "Add tabbed layout to Meetings page (Meetings + Analytics tabs)",
      "status": "completed",
      "activeForm": "Adding tabbed layout to Meetings page"
    },
    {
      "content": "Merge meeting breakdown into Meeting Detail page",
      "status": "completed",
      "activeForm": "Merging meeting breakdown into Meeting Detail page"
    },
    {
      "content": "Add redirect from old Analytics route to Meetings?tab=analytics",
      "status": "completed",
      "activeForm": "Adding redirect from old Analytics route"
    },
    {
      "content": "Clean up orphaned code and verify no broken links",
      "status": "completed",
      "activeForm": "Cleaning up orphaned code"
    }
  ]
}
All tasks are complete. Let me provide the final summary.

<summary>
## Summary: Consolidate Analytics Into Meetings Section via Tabbed Layout

### Changes Implemented
- Removed the "Analytics" item from the desktop sidebar navigation (`SideNav.tsx`)
- Removed the "Analytics" item from the mobile "More" drawer navigation (`MobileBottomNav.tsx`)
- Removed the `isActive` check for `/analytics` route from both navigation components
- Removed now-unused `AnalyticsIcon` and `AnalyticsMoreIcon` icon components
- Updated the shortcut registry to point "Go to Analytics" at `/krisp?tab=analytics` instead of `/analytics`
- Added a tabbed layout to the Meetings page (`/krisp`) with "Meetings" and "Analytics" tabs
- Tab selection is reflected in the URL via `?tab=meetings` / `?tab=analytics` query parameter for deep-linking and browser navigation
- Defaults to the "Meetings" tab when no tab parameter is present
- Tab bar includes proper ARIA roles (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby`) for accessibility
- Created `AnalyticsDashboard` component extracted from the old analytics page, containing all charts, metrics, meeting breakdown with expandable details, and filters
- Replaced the standalone analytics page (`app/(app)/analytics/page.tsx`) with a server-side redirect to `/krisp?tab=analytics` to prevent 404s for existing bookmarks/links
- Integrated per-meeting analytics (sentiment, talk-time distribution, engagement score) directly into the MeetingDetailDrawer as a new "Analytics" tab
- Created a new API endpoint `GET /api/meetings/[id]/analytics` for fetching per-meeting analytics data
- Exported `analyzeOneMeeting` from `lib/krisp/analytics.ts` to enable per-meeting analytics API
- TypeScript compilation passes with no errors

### Files Modified
- `components/ui/SideNav.tsx` — Removed Analytics nav item, isActive check, and AnalyticsIcon
- `components/ui/MobileBottomNav.tsx` — Removed Analytics from MORE_ITEMS, isActive check, and AnalyticsMoreIcon
- `lib/shortcuts/registry.ts` — Updated nav-analytics shortcut href to `/krisp?tab=analytics`
- `app/(app)/krisp/page.tsx` — Added tabbed layout (Meetings + Analytics tabs) with URL-based tab state
- `app/(app)/analytics/page.tsx` — Replaced with redirect to `/krisp?tab=analytics`
- `components/meeting/MeetingDetailDrawer.tsx` — Added per-meeting Analytics tab with sentiment, talk-time, and engagement data
- `lib/krisp/analytics.ts` — Exported `analyzeOneMeeting` function

### Files Created
- `components/meeting/AnalyticsDashboard.tsx` — Extracted analytics dashboard component (all charts, metrics, meeting breakdown)
- `app/api/meetings/[id]/analytics/route.ts` — Per-meeting analytics API endpoint

### Notes for Developer
- The old `/analytics` route now redirects to `/krisp?tab=analytics`, so existing bookmarks will continue to work
- The MeetingDetailDrawer now has 4 tabs: Transcript, Key Points, Action Items, Analytics
- Per-meeting analytics are computed on-demand via the new API endpoint using the same `analyzeOneMeeting` logic as the full analytics dashboard
- The tab state in the Meetings page uses `useSearchParams` and `router.push` for URL-based navigation — the "meetings" tab uses no param (default), while "analytics" uses `?tab=analytics`
</summary>