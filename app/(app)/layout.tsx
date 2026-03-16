import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar user={user} />
      </div>

      {/* Mobile sidebar handled inside Sidebar component */}
      <div className="lg:hidden">
        <Sidebar user={user} mobile />
      </div>

      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
