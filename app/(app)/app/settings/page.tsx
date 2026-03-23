import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "Settings — ShowsUp" };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { count: totalScans } = await supabase
    .from("scans")
    .select("id", { count: "exact", head: true });

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account.</p>
      </div>

      {/* Account details */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Account</p>
          <p className="text-xs text-gray-500 mt-0.5">Your account information.</p>
        </div>
        <div className="px-5">
          <Row label="Email"        value={user?.email ?? "—"} />
          <Row label="Member since" value={memberSince} />
          <Row label="Plan"         value="Free (Early Access)" />
          <Row label="Total scans"  value={String(totalScans ?? 0)} />
        </div>
      </div>

      {/* Session */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Session</p>
        </div>
        <div className="px-5 py-4">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
