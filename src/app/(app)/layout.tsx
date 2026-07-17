import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/shell/AppShell";

/**
 * Authoritative auth gate for every internal page. The middleware only checks the
 * token signature at the edge; this re-reads the user from Mongo, so a
 * deactivated account or revoked session is rejected on the very next request.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <AppShell user={user}>{children}</AppShell>;
}
