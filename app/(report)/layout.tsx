import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { AppHeader } from "@/components/app-header";

export default async function ReportLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div className="app-shell flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader user={user} />
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          {children}
          <footer className="hidden lg:block border-t border-gray-100 px-6 py-4 mt-auto">
            <p className="text-[11px] text-gray-400">
              © {new Date().getFullYear()} ShowsUp &nbsp;·&nbsp;{" "}
              <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</a>
              &nbsp;·&nbsp;
              <a href="/terms" className="hover:text-gray-600 transition-colors">Terms</a>
              &nbsp;·&nbsp; Open Source · MIT Licensed
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
