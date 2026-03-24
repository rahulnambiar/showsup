import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
import { IntegrationsPanel } from "./integrations-panel";

export const metadata: Metadata = { title: "Settings — ShowsUp" };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
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
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and integrations.</p>
      </div>

      {/* Account details */}
      <section className="space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Account</p>
        <div className="rounded-xl border border-white/10 bg-[#111827] overflow-hidden">
          <div className="px-5">
            <Row label="Email"        value={user?.email ?? "—"} />
            <Row label="Member since" value={memberSince} />
            <Row label="Plan"         value="Free (Early Access)" />
            <Row label="Total scans"  value={String(totalScans ?? 0)} />
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Integrations</p>
        <Suspense fallback={<div className="h-32 rounded-xl border border-white/10 bg-[#111827] animate-pulse" />}>
          <IntegrationsPanel />
        </Suspense>
      </section>

      {/* Session */}
      <section className="space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Session</p>
        <div className="rounded-xl border border-white/10 bg-[#111827] overflow-hidden">
          <div className="px-5 py-4">
            <SignOutButton />
          </div>
        </div>
      </section>
    </div>
  );
}
