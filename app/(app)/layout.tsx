import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";

/**
 * Server-side session guard for the authenticated app.
 * Any route under (app) requires a signed-in user.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-full">
      <AppHeader email={user.email ?? ""} />
      {children}
    </div>
  );
}
