import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Full-screen layout — no sidebar. Auth check only.
export default async function ReportLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
