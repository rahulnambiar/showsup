"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function generateApiToken(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const token = "su_" + randomBytes(24).toString("hex");
  const admin = getAdmin();

  const { error } = await admin
    .from("profiles")
    .upsert({ id: user.id, api_token: token }, { onConflict: "id" });

  if (error) {
    console.error("Failed to save API token:", error.message);
    return null;
  }

  return token;
}
