import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { IndexClient } from "./_components/index-client";

export const metadata: Metadata = { title: "Brand Index — ShowsUp Admin" };

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rahul@showsup.co";

export default async function BrandIndexPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.email !== ADMIN_EMAIL) redirect("/app/dashboard");

  return <IndexClient />;
}
