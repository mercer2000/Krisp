import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ invoices: [] });
  }

  const stripeInvoices = await stripe.invoices.list({
    customer: user.stripeCustomerId,
    limit: 20,
  });

  const invoices = stripeInvoices.data.map((inv) => ({
    id: inv.id,
    date: new Date((inv.created ?? 0) * 1000).toISOString(),
    amount: inv.amount_paid ?? inv.total ?? 0,
    status: inv.status ?? "unknown",
    pdfUrl: inv.invoice_pdf ?? null,
  }));

  return NextResponse.json({ invoices });
}
