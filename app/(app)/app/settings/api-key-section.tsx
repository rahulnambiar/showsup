"use client";

import { useState, useTransition } from "react";
import { Copy, Check, RefreshCw, Eye, EyeOff } from "lucide-react";
import { generateApiToken } from "./actions";

interface Props {
  initialToken: string | null;
}

export function ApiKeySection({ initialToken }: Props) {
  const [token, setToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCopy() {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleGenerate() {
    startTransition(async () => {
      const newToken = await generateApiToken();
      if (newToken) setToken(newToken);
    });
  }

  const masked = token ? token.slice(0, 8) + "••••••••••••••••••••••••" : null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] overflow-hidden">
      <div className="px-5 py-4 space-y-3">
        {token ? (
          <>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-emerald-400 bg-[#0A0E17] rounded-lg px-3 py-2.5 truncate">
                {visible ? token : masked}
              </code>
              <button
                onClick={() => setVisible((v) => !v)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                title={visible ? "Hide" : "Show"}
              >
                {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                title="Copy"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Use this token as <code className="text-gray-400">Authorization: Bearer &lt;token&gt;</code> in API requests or paste it into the Chrome extension Settings tab.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isPending ? "animate-spin" : ""}`} />
              Regenerate token (invalidates old one)
            </button>
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500 mb-3">No API key yet.</p>
            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="flex items-center gap-2 mx-auto bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
              Generate API Key
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
