import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getRequiredAdmin(): Promise<{
  id: string;
  name?: string | null;
  email?: string | null;
}> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) redirect("/auth/sign-in");

  const neonUserId = session.user.id;

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, neonUserId))
    .limit(1);

  if (!user || user.role !== "admin") redirect("/boards");

  return {
    id: neonUserId,
    name: session.user.name,
    email: session.user.email,
  };
}
