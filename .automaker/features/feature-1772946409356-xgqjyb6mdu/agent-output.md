

I'll start by exploring the existing billing and subscription components to understand the current implementation before making changes.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing billing/subscription components and Stripe integration",
      "status": "in_progress",
      "activeForm": "Exploring existing billing and subscription code"
    },
    {
      "content": "Update BillingClient: rename 'Compare Plans' to 'Select Plan', add plan switching with confirmation",
      "status": "pending",
      "activeForm": "Updating BillingClient with plan selection"
    },
    {
      "content": "Add invoice history to the billing page",
      "status": "pending",
      "activeForm": "Adding invoice history to billing page"
    },
    {
      "content": "Create/update API routes for plan switching and invoice fetching",
      "status": "pending",
      "activeForm": "Creating API routes for plan switching and invoices"
    },
    {
      "content": "Verify TypeScript compilation",
      "status": "pending",
      "activeForm": "Verifying TypeScript compilation"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\billing\\BillingClient.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\billing\\actions.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\stripe.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\stripe-plans.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useSubscription.ts"
}
Now let me check the existing billing API routes and the subscription/users schema.

🔧 Tool: Glob
Input: {
  "pattern": "app/api/billing/**/*"
}

🔧 Tool: Grep
Input: {
  "pattern": "subscriptions|stripeCustomerId|stripeSubscriptionId|stripePriceId",
  "path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\billing\\subscription\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\billing\\invoices\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "offset": 2013,
  "limit": 40
}
Now let me check the webhook handler to understand how subscription updates are processed, so I know how plan changes should be tracked.

🔧 Tool: Glob
Input: {
  "pattern": "app/api/webhooks/stripe/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\stripe\\route.ts"
}
Now I have a thorough understanding of the entire billing infrastructure. Let me update the todo list and start implementing.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing billing/subscription components and Stripe integration",
      "status": "completed",
      "activeForm": "Exploring existing billing and subscription code"
    },
    {
      "content": "Add server action for switching plans via Stripe SDK",
      "status": "in_progress",
      "activeForm": "Adding plan switching server action"
    },
    {
      "content": "Update BillingClient: rename 'Compare Plans' to 'Select Plan', add inline plan columns with 'Choose Plan' buttons and confirmation",
      "status": "pending",
      "activeForm": "Updating BillingClient with plan selection UI"
    },
    {
      "content": "Verify TypeScript compilation",
      "status": "pending",
      "activeForm": "Verifying TypeScript compilation"
    }
  ]
}
Here's my plan:

1. **Add a `switchPlan` server action** in `actions.ts` that uses the Stripe SDK to change the subscription's price (for existing subscribers) or create a checkout session (for free users upgrading).
2. **Rewrite the plan comparison modal** to show plan columns inline with "Choose Plan" buttons under each column, add a confirmation dialog, and remove the link to `/pricing`.
3. **Invoice history already exists** in the BillingClient — it's already fetching and rendering invoices. No new work needed there.

Let me start with the server action.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\billing\\actions.ts"
}
Now I need to check how the checkout page works to understand how new subscriptions are created (for free users upgrading).

🔧 Tool: Glob
Input: {
  "pattern": "app/(marketing)/checkout/**/*"
}

🔧 Tool: Grep
Input: {
  "pattern": "checkout\\.sessions\\.create",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(marketing)\\pricing\\actions.ts"
}
Now I have everything I need. Let me implement the changes. The approach:

1. **Add `switchPlan` server action** — for existing subscribers, use `stripe.subscriptions.update()` to swap the price item; for free users, create a checkout session (reusing the existing pattern).
2. **Rewrite the BillingClient** — change "Compare Plans" to "Select Plan", replace the modal with inline plan columns, add "Choose Plan" / "Current Plan" buttons, and a confirmation dialog for switching.

Let me add the `switchPlan` action first.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\billing\\actions.ts",
  "old_string": "export async function reactivateSubscription() {\n  const session = await auth();\n  if (!session?.user?.id) redirect(\"/login\");\n\n  const [sub] = await db\n    .select()\n    .from(subscriptions)\n    .where(eq(subscriptions.userId, session.user.id))\n    .limit(1);\n\n  if (!sub) return { error: \"No subscription found\" };\n\n  await stripe.subscriptions.update(sub.stripeSubscriptionId, {\n    cancel_at_period_end: false,\n  });\n\n  await db\n    .update(subscriptions)\n    .set({ cancelAtPeriodEnd: false, updatedAt: new Date() })\n    .where(eq(subscriptions.userId, session.user.id));\n\n  return { success: true };\n}",
  "new_string": "export async function reactivateSubscription() {\n  const session = await auth();\n  if (!session?.user?.id) redirect(\"/login\");\n\n  const [sub] = await db\n    .select()\n    .from(subscriptions)\n    .where(eq(subscriptions.userId, session.user.id))\n    .limit(1);\n\n  if (!sub) return { error: \"No subscription found\" };\n\n  await stripe.subscriptions.update(sub.stripeSubscriptionId, {\n    cancel_at_period_end: false,\n  });\n\n  await db\n    .update(subscriptions)\n    .set({ cancelAtPeriodEnd: false, updatedAt: new Date() })\n    .where(eq(subscriptions.userId, session.user.id));\n\n  return { success: true };\n}\n\nexport async function switchPlan(newPriceId: string) {\n  const session = await auth();\n  if (!session?.user?.id) redirect(\"/login\");\n\n  const userId = session.user.id;\n\n  // Check for existing subscription\n  const [sub] = await db\n    .select()\n    .from(subscriptions)\n    .where(eq(subscriptions.userId, userId))\n    .limit(1);\n\n  if (sub) {\n    // Existing subscriber — swap the price on the current subscription\n    const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);\n    const currentItem = stripeSub.items.data[0];\n\n    if (!currentItem) {\n      return { error: \"No subscription item found\" };\n    }\n\n    await stripe.subscriptions.update(sub.stripeSubscriptionId, {\n      items: [{ id: currentItem.id, price: newPriceId }],\n      proration_behavior: \"create_prorations\",\n      cancel_at_period_end: false,\n    });\n\n    // Update local DB — webhook will also update, but this gives instant feedback\n    await db\n      .update(subscriptions)\n      .set({\n        stripePriceId: newPriceId,\n        cancelAtPeriodEnd: false,\n        updatedAt: new Date(),\n      })\n      .where(eq(subscriptions.userId, userId));\n\n    return { success: true };\n  }\n\n  // Free user — create a checkout session\n  const [user] = await db\n    .select()\n    .from(users)\n    .where(eq(users.id, userId))\n    .limit(1);\n\n  if (!user) redirect(\"/login\");\n\n  let stripeCustomerId = user.stripeCustomerId;\n  if (!stripeCustomerId) {\n    const customer = await stripe.customers.create({\n      email: user.email,\n      name: user.displayName,\n      metadata: { userId },\n    });\n    stripeCustomerId = customer.id;\n    await db\n      .update(users)\n      .set({ stripeCustomerId })\n      .where(eq(users.id, userId));\n  }\n\n  const checkoutSession = await stripe.checkout.sessions.create({\n    customer: stripeCustomerId,\n    mode: \"subscription\",\n    payment_method_types: [\"card\"],\n    line_items: [{ price: newPriceId, quantity: 1 }],\n    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?upgraded=1`,\n    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,\n    subscription_data: {\n      metadata: { userId },\n    },\n  });\n\n  if (checkoutSession.url) {\n    redirect(checkoutSession.url);\n  }\n\n  return { error: \"Failed to create checkout session\" };\n}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing billing/subscription components and Stripe integration",
      "status": "completed",
      "activeForm": "Exploring existing billing and subscription code"
    },
    {
      "content": "Add server action for switching plans via Stripe SDK",
      "status": "completed",
      "activeForm": "Adding plan switching server action"
    },
    {
      "content": "Update BillingClient: rename 'Compare Plans' to 'Select Plan', add inline plan columns with 'Choose Plan' buttons and confirmation",
      "status": "in_progress",
      "activeForm": "Updating BillingClient with plan selection UI"
    },
    {
      "content": "Verify TypeScript compilation",
      "status": "pending",
      "activeForm": "Verifying TypeScript compilation"
    }
  ]
}
Now I need to update the BillingClient. I need to know the plan price IDs so the client can pass them to the `switchPlan` action. Since `stripe-plans.ts` reads from env vars (server-side only), I'll create an API endpoint to expose the available plans, or I can pass plan info from the server page. Actually, the simpler approach: I'll add an API route that returns available plans with their price IDs. Let me first check if there's already something like that.

🔧 Tool: Grep
Input: {
  "pattern": "api/billing/plans|api/plans",
  "output_mode": "files_with_matches"
}
No existing plans API. I'll create one that returns plan display info with price IDs.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\billing\\plans\\route.ts",
  "content": "\"use server\";\n\nimport { NextResponse } from \"next/server\";\nimport { PLANS, PLAN_ORDER } from \"@/lib/stripe-plans\";\n\nexport async function GET() {\n  const plans = PLAN_ORDER.map((key) => {\n    const plan = PLANS[key];\n    return {\n      key,\n      name: plan.name,\n      description: plan.description,\n      monthlyPrice: plan.monthlyPrice,\n      monthlyPriceId: plan.monthlyPriceId || null,\n      featureMatrix: plan.featureMatrix,\n      highlighted: plan.highlighted ?? false,\n    };\n  });\n\n  return NextResponse.json({ plans });\n}\n"
}
Now let me rewrite the BillingClient. I need to:
1. Change "Compare Plans" button text to "Select Plan"
2. Replace the comparison modal with inline plan columns showing "Choose Plan" buttons
3. Add a confirmation dialog when switching plans
4. Remove links to `/pricing`
5. Keep the existing invoice history section (it already works)

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\billing\\BillingClient.tsx"
}
Now I'll rewrite the BillingClient with the new plan selection UI. The key changes:

1. Import `switchPlan` action
2. Fetch plans from `/api/billing/plans` to get price IDs
3. Change "Compare Plans" to "Select Plan"  
4. Replace the comparison modal with one that has "Choose Plan" buttons under each column
5. Add a switch confirmation modal
6. Remove `/pricing` links

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\billing\\BillingClient.tsx",
  "content": "\"use client\";\n\nimport { useState, useEffect, useTransition, useCallback } from \"react\";\nimport { createPortalSession, cancelSubscription, reactivateSubscription, switchPlan } from \"./actions\";\n\ninterface SubscriptionData {\n  planName: string;\n  planKey: string;\n  status: string;\n  stripePriceId: string;\n  currentPeriodEnd: string;\n  cancelAtPeriodEnd: boolean;\n  monthlyAmount: number;\n}\n\ninterface InvoiceData {\n  id: string;\n  date: string;\n  amount: number;\n  status: string;\n  pdfUrl: string | null;\n}\n\ninterface PlanData {\n  key: string;\n  name: string;\n  description: string;\n  monthlyPrice: number;\n  monthlyPriceId: string | null;\n  featureMatrix: Record<string, string | boolean>;\n  highlighted: boolean;\n}\n\nconst STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {\n  active: { bg: \"bg-emerald-500/10\", text: \"text-emerald-400\", label: \"Active\" },\n  trialing: { bg: \"bg-blue-500/10\", text: \"text-blue-400\", label: \"Trialing\" },\n  past_due: { bg: \"bg-amber-500/10\", text: \"text-amber-400\", label: \"Past Due\" },\n  canceled: { bg: \"bg-red-500/10\", text: \"text-red-400\", label: \"Canceled\" },\n  unpaid: { bg: \"bg-red-500/10\", text: \"text-red-400\", label: \"Unpaid\" },\n  incomplete: { bg: \"bg-slate-500/10\", text: \"text-slate-400\", label: \"Incomplete\" },\n};\n\nconst FEATURE_MATRIX_ROWS = [\n  \"Kanban boards\",\n  \"Kanban cards\",\n  \"Open Brain captures\",\n  \"Email integrations\",\n  \"MCP access\",\n  \"AI features\",\n  \"Meeting search\",\n  \"Weekly review\",\n  \"Priority support\",\n  \"Early access\",\n];\n\nexport function BillingClient({ userId }: { userId: string }) {\n  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);\n  const [invoices, setInvoices] = useState<InvoiceData[]>([]);\n  const [plans, setPlans] = useState<PlanData[]>([]);\n  const [loading, setLoading] = useState(true);\n  const [isPending, startTransition] = useTransition();\n  const [showCancelConfirm, setShowCancelConfirm] = useState(false);\n  const [showPlanSelector, setShowPlanSelector] = useState(false);\n  const [switchTarget, setSwitchTarget] = useState<PlanData | null>(null);\n\n  const fetchBillingData = useCallback(async () => {\n    try {\n      const [subRes, invRes, plansRes] = await Promise.all([\n        fetch(\"/api/billing/subscription\"),\n        fetch(\"/api/billing/invoices\"),\n        fetch(\"/api/billing/plans\"),\n      ]);\n      if (subRes.ok) {\n        const data = await subRes.json();\n        setSubscription(data.subscription);\n      }\n      if (invRes.ok) {\n        const data = await invRes.json();\n        setInvoices(data.invoices ?? []);\n      }\n      if (plansRes.ok) {\n        const data = await plansRes.json();\n        setPlans(data.plans ?? []);\n      }\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  useEffect(() => {\n    fetchBillingData();\n  }, [fetchBillingData]);\n\n  function handleManagePortal() {\n    startTransition(async () => {\n      await createPortalSession();\n    });\n  }\n\n  function handleCancel() {\n    startTransition(async () => {\n      await cancelSubscription();\n      setShowCancelConfirm(false);\n      fetchBillingData();\n    });\n  }\n\n  function handleReactivate() {\n    startTransition(async () => {\n      await reactivateSubscription();\n      fetchBillingData();\n    });\n  }\n\n  function handleSwitchPlan() {\n    if (!switchTarget?.monthlyPriceId) return;\n    startTransition(async () => {\n      await switchPlan(switchTarget.monthlyPriceId!);\n      setSwitchTarget(null);\n      setShowPlanSelector(false);\n      fetchBillingData();\n    });\n  }\n\n  if (loading) {\n    return (\n      <div className=\"p-6 max-w-4xl mx-auto\">\n        <h1 className=\"text-2xl font-bold text-[var(--foreground)] mb-6\">Billing</h1>\n        <div className=\"space-y-4\">\n          {[1, 2, 3].map((i) => (\n            <div key={i} className=\"h-24 rounded-lg bg-[var(--muted)] animate-pulse\" />\n          ))}\n        </div>\n      </div>\n    );\n  }\n\n  const currentPlanKey = subscription?.planKey ?? \"free\";\n  const statusInfo = subscription\n    ? (STATUS_COLORS[subscription.status] ?? STATUS_COLORS.incomplete)\n    : null;\n\n  const planOrder = plans.length > 0 ? plans : [];\n  const currentPlanIndex = planOrder.findIndex((p) => p.key === currentPlanKey);\n\n  return (\n    <div className=\"p-6 max-w-4xl mx-auto\">\n      <h1 className=\"text-2xl font-bold text-[var(--foreground)] mb-6\">Billing</h1>\n\n      {/* Past due banner */}\n      {subscription?.status === \"past_due\" && (\n        <div className=\"rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mb-6 flex items-center justify-between\">\n          <div>\n            <p className=\"text-sm font-medium text-amber-400\">Payment past due</p>\n            <p className=\"text-xs text-[var(--muted-foreground)]\">\n              Update your payment method to avoid losing access.\n            </p>\n          </div>\n          <button\n            onClick={handleManagePortal}\n            disabled={isPending}\n            className=\"px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50\"\n          >\n            Update payment\n          </button>\n        </div>\n      )}\n\n      {/* Subscription status card */}\n      <div className=\"rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 mb-6\">\n        <div className=\"flex items-start justify-between flex-wrap gap-4\">\n          <div>\n            <div className=\"flex items-center gap-3 mb-1\">\n              <h2 className=\"text-lg font-semibold text-[var(--foreground)]\">\n                {subscription ? `${subscription.planName} Plan` : \"Free Plan\"}\n              </h2>\n              {statusInfo && (\n                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>\n                  {statusInfo.label}\n                </span>\n              )}\n            </div>\n            <p className=\"text-sm text-[var(--muted-foreground)]\">\n              {subscription\n                ? `$${(subscription.monthlyAmount / 100).toFixed(2)}/mo`\n                : \"Free — no charge\"}\n            </p>\n            {subscription && (\n              <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                {subscription.cancelAtPeriodEnd\n                  ? `Access until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`\n                  : `Next billing date: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}\n              </p>\n            )}\n            {subscription?.cancelAtPeriodEnd && (\n              <p className=\"text-sm text-amber-500 mt-2\">\n                Your subscription will end at the current period. You can reactivate anytime before then.\n              </p>\n            )}\n          </div>\n          <div className=\"flex gap-2\">\n            <button\n              onClick={() => setShowPlanSelector(true)}\n              className=\"px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors\"\n            >\n              Select plan\n            </button>\n            {subscription && (\n              <>\n                {subscription.cancelAtPeriodEnd ? (\n                  <button\n                    onClick={handleReactivate}\n                    disabled={isPending}\n                    className=\"px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50\"\n                  >\n                    Reactivate\n                  </button>\n                ) : (\n                  <button\n                    onClick={() => setShowCancelConfirm(true)}\n                    disabled={isPending}\n                    className=\"px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:border-[var(--destructive)] transition-colors disabled:opacity-50\"\n                  >\n                    Cancel plan\n                  </button>\n                )}\n                <button\n                  onClick={handleManagePortal}\n                  disabled={isPending}\n                  className=\"px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n                >\n                  Manage billing\n                </button>\n              </>\n            )}\n          </div>\n        </div>\n      </div>\n\n      {/* Cancel confirmation modal */}\n      {showCancelConfirm && subscription && (\n        <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4\">\n          <div className=\"rounded-lg bg-[var(--card)] border border-[var(--border)] p-6 max-w-md w-full\">\n            <h3 className=\"text-lg font-semibold text-[var(--foreground)] mb-2\">\n              Cancel subscription?\n            </h3>\n            <p className=\"text-sm text-[var(--muted-foreground)] mb-4\">\n              Your access will continue until{\" \"}\n              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.\n              After that, you&apos;ll be on the Free plan.\n            </p>\n            <div className=\"text-sm text-[var(--muted-foreground)] mb-6\">\n              <p className=\"font-medium text-[var(--foreground)] mb-2\">You&apos;ll lose access to:</p>\n              <ul className=\"space-y-1 ml-4\">\n                {currentPlanKey === \"pro\" && (\n                  <>\n                    <li>- AI features (Brain chat, daily briefing, etc.)</li>\n                    <li>- Full MCP read/write access</li>\n                    <li>- Priority support</li>\n                  </>\n                )}\n                {(currentPlanKey === \"pro\" || currentPlanKey === \"standard\") && (\n                  <>\n                    <li>- Unlimited boards and cards</li>\n                    <li>- Extra email integrations</li>\n                  </>\n                )}\n              </ul>\n              <p className=\"mt-2 text-xs\">Your existing data will remain accessible in read-only mode.</p>\n            </div>\n            <div className=\"flex gap-3 justify-end\">\n              <button\n                onClick={() => setShowCancelConfirm(false)}\n                className=\"px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors\"\n              >\n                Keep plan\n              </button>\n              <button\n                onClick={handleCancel}\n                disabled={isPending}\n                className=\"px-4 py-2 rounded-lg text-sm font-medium bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n              >\n                {isPending ? \"Cancelling...\" : \"Cancel subscription\"}\n              </button>\n            </div>\n          </div>\n        </div>\n      )}\n\n      {/* Plan selector modal */}\n      {showPlanSelector && (\n        <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4\">\n          <div className=\"rounded-lg bg-[var(--card)] border border-[var(--border)] p-6 max-w-4xl w-full max-h-[85vh] overflow-auto\">\n            <div className=\"flex items-center justify-between mb-6\">\n              <h3 className=\"text-lg font-semibold text-[var(--foreground)]\">\n                Select Plan\n              </h3>\n              <button\n                onClick={() => setShowPlanSelector(false)}\n                className=\"p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]\"\n              >\n                <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n                  <line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\" />\n                  <line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\" />\n                </svg>\n              </button>\n            </div>\n\n            {/* Plan columns */}\n            <div className=\"grid grid-cols-3 gap-4 mb-6\">\n              {planOrder.map((plan, idx) => {\n                const isCurrent = plan.key === currentPlanKey;\n                const isUpgrade = idx > currentPlanIndex;\n                const isDowngrade = idx < currentPlanIndex;\n                const price = plan.monthlyPrice\n                  ? `$${(plan.monthlyPrice / 100).toFixed(0)}`\n                  : \"$0\";\n\n                return (\n                  <div\n                    key={plan.key}\n                    className={`relative rounded-xl border p-5 flex flex-col ${\n                      isCurrent\n                        ? \"border-[var(--primary)] bg-[var(--primary)]/5\"\n                        : plan.highlighted\n                        ? \"border-[var(--primary)]/40 bg-[var(--card)]\"\n                        : \"border-[var(--border)] bg-[var(--card)]\"\n                    }`}\n                  >\n                    {isCurrent && (\n                      <span className=\"absolute -top-2.5 left-4 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--primary)] text-[var(--primary-foreground)]\">\n                        Current plan\n                      </span>\n                    )}\n                    <h4 className=\"text-base font-semibold text-[var(--foreground)] mb-1\">\n                      {plan.name}\n                    </h4>\n                    <p className=\"text-xs text-[var(--muted-foreground)] mb-3\">\n                      {plan.description}\n                    </p>\n                    <div className=\"mb-4\">\n                      <span className=\"text-2xl font-bold text-[var(--foreground)]\">\n                        {price}\n                      </span>\n                      <span className=\"text-sm text-[var(--muted-foreground)]\">/mo</span>\n                    </div>\n\n                    {/* Feature list */}\n                    <ul className=\"flex-1 space-y-2 mb-5\">\n                      {FEATURE_MATRIX_ROWS.map((feature) => {\n                        const val = plan.featureMatrix[feature];\n                        const enabled = val !== false;\n                        return (\n                          <li key={feature} className=\"flex items-start gap-2 text-xs\">\n                            {enabled ? (\n                              <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2.5\" strokeLinecap=\"round\" strokeLinejoin=\"round\" className=\"text-emerald-400 shrink-0 mt-0.5\">\n                                <polyline points=\"20 6 9 17 4 12\" />\n                              </svg>\n                            ) : (\n                              <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\" className=\"text-[var(--muted-foreground)]/40 shrink-0 mt-0.5\">\n                                <line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\" />\n                                <line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\" />\n                              </svg>\n                            )}\n                            <span className={enabled ? \"text-[var(--foreground)]\" : \"text-[var(--muted-foreground)]\"}>\n                              {typeof val === \"string\" ? `${feature}: ${val}` : feature}\n                            </span>\n                          </li>\n                        );\n                      })}\n                    </ul>\n\n                    {/* Choose Plan button */}\n                    {isCurrent ? (\n                      <button\n                        disabled\n                        className=\"w-full py-2.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--muted-foreground)] cursor-default\"\n                      >\n                        Current plan\n                      </button>\n                    ) : plan.key === \"free\" ? (\n                      <button\n                        onClick={() => {\n                          setShowPlanSelector(false);\n                          setShowCancelConfirm(true);\n                        }}\n                        className=\"w-full py-2.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors\"\n                      >\n                        Downgrade to Free\n                      </button>\n                    ) : (\n                      <button\n                        onClick={() => setSwitchTarget(plan)}\n                        disabled={isPending}\n                        className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${\n                          isUpgrade\n                            ? \"bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90\"\n                            : \"border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]\"\n                        }`}\n                      >\n                        {isUpgrade ? `Upgrade to ${plan.name}` : isDowngrade ? `Switch to ${plan.name}` : `Choose ${plan.name}`}\n                      </button>\n                    )}\n                  </div>\n                );\n              })}\n            </div>\n          </div>\n        </div>\n      )}\n\n      {/* Switch plan confirmation modal */}\n      {switchTarget && (\n        <div className=\"fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4\">\n          <div className=\"rounded-lg bg-[var(--card)] border border-[var(--border)] p-6 max-w-md w-full\">\n            <h3 className=\"text-lg font-semibold text-[var(--foreground)] mb-2\">\n              Switch to {switchTarget.name} plan?\n            </h3>\n            <p className=\"text-sm text-[var(--muted-foreground)] mb-4\">\n              {subscription\n                ? `Your plan will change from ${subscription.planName} to ${switchTarget.name}. Any price difference will be prorated on your next invoice.`\n                : `You'll be subscribed to the ${switchTarget.name} plan at $${(switchTarget.monthlyPrice / 100).toFixed(2)}/mo.`}\n            </p>\n            <div className=\"rounded-lg bg-[var(--muted)] p-3 mb-6\">\n              <div className=\"flex items-center justify-between text-sm\">\n                <span className=\"text-[var(--muted-foreground)]\">New plan</span>\n                <span className=\"font-medium text-[var(--foreground)]\">{switchTarget.name}</span>\n              </div>\n              <div className=\"flex items-center justify-between text-sm mt-1\">\n                <span className=\"text-[var(--muted-foreground)]\">Price</span>\n                <span className=\"font-medium text-[var(--foreground)]\">\n                  ${(switchTarget.monthlyPrice / 100).toFixed(2)}/mo\n                </span>\n              </div>\n              {subscription && (\n                <div className=\"flex items-center justify-between text-sm mt-1\">\n                  <span className=\"text-[var(--muted-foreground)]\">Billing</span>\n                  <span className=\"text-xs text-[var(--muted-foreground)]\">Prorated</span>\n                </div>\n              )}\n            </div>\n            <div className=\"flex gap-3 justify-end\">\n              <button\n                onClick={() => setSwitchTarget(null)}\n                className=\"px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors\"\n              >\n                Cancel\n              </button>\n              <button\n                onClick={handleSwitchPlan}\n                disabled={isPending}\n                className=\"px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n              >\n                {isPending ? \"Switching...\" : `Confirm switch to ${switchTarget.name}`}\n              </button>\n            </div>\n          </div>\n        </div>\n      )}\n\n      {/* Invoices */}\n      <div className=\"rounded-lg border border-[var(--border)] bg-[var(--card)] p-6\">\n        <h2 className=\"text-lg font-semibold text-[var(--foreground)] mb-4\">\n          Invoice history\n        </h2>\n        {invoices.length === 0 ? (\n          <p className=\"text-sm text-[var(--muted-foreground)]\">\n            {!subscription ? \"No invoices — you\\u2019re on the Free plan.\" : \"No invoices yet.\"}\n          </p>\n        ) : (\n          <div className=\"overflow-x-auto\">\n            <table className=\"w-full text-sm\">\n              <thead>\n                <tr className=\"border-b border-[var(--border)]\">\n                  <th className=\"text-left py-2 text-[var(--muted-foreground)] font-medium\">Date</th>\n                  <th className=\"text-left py-2 text-[var(--muted-foreground)] font-medium\">Amount</th>\n                  <th className=\"text-left py-2 text-[var(--muted-foreground)] font-medium\">Status</th>\n                  <th className=\"text-right py-2 text-[var(--muted-foreground)] font-medium\">Invoice</th>\n                </tr>\n              </thead>\n              <tbody>\n                {invoices.map((inv) => (\n                  <tr key={inv.id} className=\"border-b border-[var(--border)] last:border-0\">\n                    <td className=\"py-3 text-[var(--foreground)]\">\n                      {new Date(inv.date).toLocaleDateString()}\n                    </td>\n                    <td className=\"py-3 text-[var(--foreground)]\">\n                      ${(inv.amount / 100).toFixed(2)}\n                    </td>\n                    <td className=\"py-3\">\n                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${\n                        inv.status === \"paid\"\n                          ? \"bg-emerald-500/10 text-emerald-400\"\n                          : inv.status === \"open\"\n                          ? \"bg-amber-500/10 text-amber-400\"\n                          : \"bg-red-500/10 text-red-400\"\n                      }`}>\n                        {inv.status === \"paid\" ? \"Paid\" : inv.status === \"open\" ? \"Open\" : \"Failed\"}\n                      </span>\n                    </td>\n                    <td className=\"py-3 text-right\">\n                      {inv.pdfUrl && (\n                        <a\n                          href={inv.pdfUrl}\n                          target=\"_blank\"\n                          rel=\"noopener noreferrer\"\n                          className=\"text-[var(--primary)] hover:underline text-xs\"\n                        >\n                          Download PDF\n                        </a>\n                      )}\n                    </td>\n                  </tr>\n                ))}\n              </tbody>\n            </table>\n          </div>\n        )}\n      </div>\n    </div>\n  );\n}\n"
}
Now let me fix the plans API route — it shouldn't have `"use server"` since it's a route handler, not a server action.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\billing\\plans\\route.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\billing\\plans\\route.ts",
  "old_string": "\"use server\";\n\nimport { NextResponse } from \"next/server\";",
  "new_string": "import { NextResponse } from \"next/server\";"
}
Now let me run TypeScript compilation to verify everything compiles.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing billing/subscription components and Stripe integration",
      "status": "completed",
      "activeForm": "Exploring existing billing and subscription code"
    },
    {
      "content": "Add server action for switching plans via Stripe SDK",
      "status": "completed",
      "activeForm": "Adding plan switching server action"
    },
    {
      "content": "Update BillingClient: rename 'Compare Plans' to 'Select Plan', add inline plan columns with 'Choose Plan' buttons and confirmation",
      "status": "completed",
      "activeForm": "Updating BillingClient with plan selection UI"
    },
    {
      "content": "Verify TypeScript compilation",
      "status": "in_progress",
      "activeForm": "Verifying TypeScript compilation"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx tsc --noEmit --pretty 2>&1 | head -40",
  "description": "Run TypeScript check on project",
  "timeout": 120000
}
Clean compilation with no errors.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing billing/subscription components and Stripe integration",
      "status": "completed",
      "activeForm": "Exploring existing billing and subscription code"
    },
    {
      "content": "Add server action for switching plans via Stripe SDK",
      "status": "completed",
      "activeForm": "Adding plan switching server action"
    },
    {
      "content": "Update BillingClient: rename 'Compare Plans' to 'Select Plan', add inline plan columns with 'Choose Plan' buttons and confirmation",
      "status": "completed",
      "activeForm": "Updating BillingClient with plan selection UI"
    },
    {
      "content": "Verify TypeScript compilation",
      "status": "completed",
      "activeForm": "Verifying TypeScript compilation"
    }
  ]
}
All done. Here's a summary of the changes:

### Changes Made

**1. `app/(app)/billing/actions.ts`** — Added `switchPlan` server action
- For **existing subscribers**: uses `stripe.subscriptions.update()` to swap the price item on their current subscription with `proration_behavior: "create_prorations"`, so they're billed fairly for the difference
- For **free users** (no existing subscription): creates a Stripe Checkout session that redirects to payment, then returns to `/settings/billing`
- Also updates the local DB immediately for instant UI feedback (webhook will confirm asynchronously)

**2. `app/(app)/billing/BillingClient.tsx`** — Rewrote the plan selection UI
- "Compare plans" button renamed to **"Select plan"**
- Plan comparison modal replaced with a **3-column plan selector** showing each plan with its features and a "Choose Plan" button underneath each column
- Current plan shows a **"Current plan"** badge and disabled button
- Free plan shows **"Downgrade to Free"** (triggers the cancel confirmation)
- Paid plans show **"Upgrade to..."** or **"Switch to..."** depending on direction
- Clicking a plan button opens a **confirmation dialog** showing the new plan, price, and proration note
- **No links to `/pricing`** — everything happens inline
- Invoice history section preserved as-is (it was already working)

**3. `app/api/billing/plans/route.ts`** — New API route
- Returns available plans with their price IDs, names, descriptions, prices, and feature matrices
- Reads from the server-side `PLANS` config so price IDs from env vars are properly resolved