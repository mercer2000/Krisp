import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getRequiredUser(): Promise<{
  id: string;
  name?: string | null;
  email?: string | null;
}> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) redirect("/auth/sign-in");

  const neonUserId = session.user.id;
  const name = session.user.name;
  const email = session.user.email;

  // Auto-sync: ensure user exists in our users table
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, neonUserId));

  if (!existing) {
    await db
      .insert(users)
      .values({
        id: neonUserId,
        username: email ?? neonUserId,
        email: email ?? "",
        displayName: name ?? email ?? "User",
      })
      .onConflictDoNothing();
  }

  return { id: neonUserId, name, email };
}
