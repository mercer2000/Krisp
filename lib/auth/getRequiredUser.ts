import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function getRequiredUser(): Promise<{ id: string; name?: string | null; email?: string | null }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}
