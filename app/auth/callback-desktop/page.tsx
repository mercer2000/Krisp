import { auth } from "@/lib/auth/server";

export default async function CallbackDesktopPage() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return <pre>{JSON.stringify({ error: "Not authenticated" }, null, 2)}</pre>;
  }

  const payload = {
    access_token: session.session.token,
    user: {
      id: session.user.id,
      email: session.user.email,
    },
  };

  // CallGuard reads document.body.innerText to extract this JSON
  return <pre>{JSON.stringify(payload)}</pre>;
}
