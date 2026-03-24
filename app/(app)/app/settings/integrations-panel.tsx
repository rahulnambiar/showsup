"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface GscStatus {
  connected: boolean;
  site_url: string | null;
  connected_at: string | null;
}

export function IntegrationsPanel() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [gsc, setGsc]     = useState<GscStatus | null>(null);
  const [syncing, setSyncing]   = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const res  = await fetch("/api/gsc/status");
    if (res.ok) setGsc(await res.json() as GscStatus);
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  // Handle redirect back from OAuth
  useEffect(() => {
    const result = searchParams.get("gsc");
    if (result === "connected") {
      setToast("Google Search Console connected!");
      void loadStatus();
      router.replace("/app/settings");
    } else if (result === "error") {
      setToast("Connection failed. Please try again.");
      router.replace("/app/settings");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    const res = await fetch("/api/gsc/disconnect", { method: "POST" });
    if (res.ok) { await loadStatus(); setToast("Disconnected."); }
    setDisconnecting(false);
  }

  async function handleSync() {
    setSyncing(true);
    setToast("Sync triggered — refresh report pages to see updated data.");
    await new Promise<void>((r) => setTimeout(r, 1500));
    setSyncing(false);
  }

  const connectedAt = gsc?.connected_at
    ? new Date(gsc.connected_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="space-y-4">
      {toast && (
        <div className="rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 px-4 py-2.5 text-sm text-[#10B981]">
          {toast}
        </div>
      )}

      {/* Google Search Console */}
      <div className="rounded-xl border border-white/10 bg-[#111827] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
          {/* GSC logo */}
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48" fill="none">
            <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4z" fill="#4285F4"/>
            <path d="M24 14c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="white"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-white">Google Search Console</p>
            <p className="text-xs text-gray-500">Correlate AI visibility with actual search performance</p>
          </div>
          <div className="ml-auto">
            {gsc?.connected ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                Connected
              </span>
            ) : (
              <span className="text-xs text-gray-600">Not connected</span>
            )}
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          {gsc?.connected ? (
            <>
              <div className="space-y-1">
                {gsc.site_url && (
                  <p className="text-sm text-gray-300">
                    <span className="text-gray-500">Site: </span>{gsc.site_url}
                  </p>
                )}
                {connectedAt && (
                  <p className="text-xs text-gray-600">Connected {connectedAt}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="text-sm border border-white/15 text-gray-300 hover:text-white hover:border-white/30 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                >
                  {syncing ? "Syncing…" : "Sync Now"}
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-sm border border-[#EF4444]/20 text-[#EF4444]/70 hover:text-[#EF4444] hover:border-[#EF4444]/40 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500 leading-relaxed">
                Connect GSC to see which Google search queries your brand ranks for, how AI and search visibility correlate, and which high-traffic pages AI never cites.
              </p>
              <a
                href="/api/auth/google-gsc"
                className="inline-flex items-center gap-2 bg-white text-gray-900 font-medium rounded-lg px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Connect Google Search Console
              </a>
            </>
          )}
        </div>
      </div>

      {/* Google Analytics 4 — Coming soon */}
      <div className="rounded-xl border border-white/5 bg-[#111827]/50 overflow-hidden opacity-50">
        <div className="px-5 py-4 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48" fill="none">
            <rect width="10" height="28" x="6" y="14" rx="2" fill="#F37C20"/>
            <rect width="10" height="38" x="19" y="4" rx="2" fill="#E8710A"/>
            <rect width="10" height="18" x="32" y="24" rx="2" fill="#F9AB00"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-white">Google Analytics 4</p>
            <p className="text-xs text-gray-500">Traffic source breakdown</p>
          </div>
          <span className="ml-auto text-[10px] font-medium text-gray-500 border border-white/10 rounded-full px-2 py-0.5">Coming soon</span>
        </div>
      </div>

      {/* Shopify */}
      <div className="rounded-xl border border-white/5 bg-[#111827]/50 overflow-hidden opacity-50">
        <div className="px-5 py-4 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48" fill="none">
            <path d="M33 7l-2 28-9 3-9-3L11 7l5-1 1 4 2-5 5 1-1-4 5-1 1 4 2-4 2 1z" fill="#95BF47"/>
            <path d="M22 10l-1 25 1 3v-28z" fill="#5E8E3E"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-white">Shopify</p>
            <p className="text-xs text-gray-500">Product visibility in AI shopping queries</p>
          </div>
          <span className="ml-auto text-[10px] font-medium text-gray-500 border border-white/10 rounded-full px-2 py-0.5">Install plugin</span>
        </div>
      </div>
    </div>
  );
}
