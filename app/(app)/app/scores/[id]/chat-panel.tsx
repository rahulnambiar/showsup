"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FREE_CHAT_MESSAGES, CHAT_TOKEN_COST, type ChatMessage } from "@/lib/chat/prompt";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getSuggestions(
  score:           number,
  competitors:     string[],
  categoryScores:  Record<string, number> | null,
  hasRegionalData: boolean,
): string[] {
  const suggestions: string[] = ["What should I fix first?"];

  if (score < 50)          suggestions.push("Why is my score so low?");
  else if (score < 70)     suggestions.push("How do I get above 70?");

  if (competitors.length)  suggestions.push(`How do I beat ${competitors[0]}?`);

  if (categoryScores) {
    const entries = Object.entries(categoryScores).sort((a, b) => a[1] - b[1]);
    if (entries.length) {
      const [name, s] = entries[0]!;
      suggestions.push(`Why is ${name} only ${s}/100?`);
    }
  }

  if (hasRegionalData) suggestions.push("Which regions should I prioritise?");
  suggestions.push("Draft a 30-day action plan");
  suggestions.push("Write a summary for my CMO");

  return suggestions.slice(0, 5);
}

// ── Inline markdown renderer ───────────────────────────────────────────────────

function renderLine(line: string): React.ReactNode[] {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

function MessageContent({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="space-y-1.5 text-[14px] text-gray-700 leading-relaxed">
      {paragraphs.map((para, i) => {
        const lines = para.split("\n");
        // detect bullet list
        const isList = lines.every(l => l.startsWith("- ") || l.startsWith("• "));
        if (isList) {
          return (
            <ul key={i} className="list-disc list-inside space-y-0.5 pl-1">
              {lines.map((l, j) => (
                <li key={j}>{renderLine(l.replace(/^[-•]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((line, j) => (
              <span key={j}>
                {renderLine(line)}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  scanId:           string;
  brand:            string;
  score:            number;
  competitors:      string[];
  categoryScores:   Record<string, number> | null;
  hasRegionalData:  boolean;
  initialMessages:  ChatMessage[];
  initialFreeUsed:  number;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ChatPanel({
  scanId,
  brand,
  score,
  competitors,
  categoryScores,
  hasRegionalData,
  initialMessages,
  initialFreeUsed,
}: Props) {
  const [isOpen,        setIsOpen]        = useState(false);
  const [messages,      setMessages]      = useState<ChatMessage[]>(initialMessages);
  const [input,         setInput]         = useState("");
  const [isStreaming,   setIsStreaming]    = useState(false);
  const [freeUsed,      setFreeUsed]      = useState(initialFreeUsed);
  const [showCopied,    setShowCopied]    = useState(false);
  const [tokenError,    setTokenError]    = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // ── Listen for context triggers ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { message } = (e as CustomEvent<{ message: string }>).detail;
      setIsOpen(true);
      setInput(message);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    window.addEventListener("showsup:chat", handler);
    return () => window.removeEventListener("showsup:chat", handler);
  }, []);

  // ── Auto-scroll ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // ── Focus input when panel opens ──────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const suggestions = getSuggestions(score, competitors, categoryScores, hasRegionalData);

  const freeRemaining  = Math.max(0, FREE_CHAT_MESSAGES - freeUsed);
  const isSelfHost     = false; // server-side flag — always false on client

  // ── Greeting (shown when no messages yet) ────────────────────────────────────
  const greeting: ChatMessage = {
    role:    "assistant",
    content: `Your ShowsUp Score is **${score}/100**. I have your complete scan data for **${brand}**. Ask me anything about your AI visibility, competitors, or what to do next.`,
  };
  const displayMessages = messages.length > 0 ? messages : [greeting];

  // ── Send message ──────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setTokenError(null);
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat/report", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ scanId, messages: newMessages }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string; balance?: number };
        if (res.status === 402) {
          setTokenError(`Out of tokens (balance: ${err.balance ?? 0}). Top up to continue chatting.`);
        } else {
          setTokenError(err.error ?? "Something went wrong.");
        }
        setMessages(newMessages); // remove empty assistant message
        return;
      }

      const freeHeader = res.headers.get("X-Free-Remaining");
      if (freeHeader !== null) {
        const newFreeUsed = Math.max(0, FREE_CHAT_MESSAGES - parseInt(freeHeader, 10));
        setFreeUsed(newFreeUsed);
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let   full    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: full };
          return updated;
        });
      }
    } catch {
      setTokenError("Connection error. Please try again.");
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Something went wrong. Please try again." };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming, scanId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  // ── Copy conversation ─────────────────────────────────────────────────────────
  const copyConversation = async () => {
    const text = messages
      .map(m => `**${m.role === "user" ? "You" : "AI Analyst"}**\n${m.content}`)
      .join("\n\n---\n\n");
    await navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  // ── Clear chat ────────────────────────────────────────────────────────────────
  const clearChat = () => {
    setMessages([]);
    setTokenError(null);
    void fetch("/api/chat/report", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ scanId }),
    });
  };

  const showSuggestions = messages.length === 0 && !isStreaming;

  return (
    <>
      {/* ── Floating trigger button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Ask AI about this report"
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-[60] w-14 h-14 rounded-full bg-[#10B981] hover:bg-[#059669] text-white shadow-lg flex items-center justify-center transition-colors group"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="absolute right-16 bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Ask AI about this report
          </span>
        </button>
      )}

      {/* ── Slide-over panel ── */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-[60] w-full sm:w-[400px] flex flex-col bg-white shadow-2xl border-l border-gray-200">

          {/* Header */}
          <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div>
              <p className="font-semibold text-gray-900 text-[15px]">AI Analyst</p>
              <p className="text-[12px] text-gray-400 mt-0.5">Ask anything about your report</p>
            </div>
            <div className="flex items-center gap-1 ml-4 flex-shrink-0">
              {messages.length > 0 && (
                <>
                  <button
                    onClick={() => void copyConversation()}
                    title="Copy conversation"
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-xs"
                  >
                    {showCopied ? (
                      <svg className="w-4 h-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={clearChat}
                    title="Clear chat"
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {displayMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-[#10B981]/10 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                    <svg className="w-3.5 h-3.5 text-[#10B981]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 010 2h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 010-2h1a7 7 0 017-7h1V5.73A2 2 0 0110 4a2 2 0 012-2z"/>
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
                    msg.role === "user"
                      ? "bg-[#F0FDF4] border border-[#D1FAE5]"
                      : "bg-[#F9FAFB] border border-gray-100"
                  }`}
                >
                  {msg.role === "assistant" && msg.content === "" && isStreaming && i === displayMessages.length - 1 ? (
                    <TypingDots />
                  ) : (
                    <MessageContent text={msg.content} />
                  )}
                </div>
              </div>
            ))}
            {tokenError && (
              <div className="rounded-xl px-3.5 py-2.5 bg-red-50 border border-red-100 text-[13px] text-red-600">
                {tokenError}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-100">
            {/* Suggested questions */}
            {showSuggestions && (
              <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => void sendMessage(q)}
                    className="text-[12px] text-gray-600 bg-[#F3F4F6] hover:bg-gray-200 rounded-full px-3 py-1.5 transition-colors text-left leading-tight"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Token counter */}
            {!isSelfHost && (
              <div className="px-4 pt-2">
                {freeRemaining > 0 ? (
                  <p className="text-[11px] text-gray-400">
                    {freeRemaining} free question{freeRemaining !== 1 ? "s" : ""} remaining
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400">
                    Free messages used — {CHAT_TOKEN_COST} tokens/message
                  </p>
                )}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 flex gap-2 items-end">
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question…"
                rows={1}
                disabled={isStreaming}
                className="flex-1 min-h-[44px] max-h-[120px] resize-none border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] disabled:opacity-50 disabled:bg-gray-50 leading-relaxed"
                style={{ outline: "none" }}
              />
              <button
                onClick={() => void sendMessage(input)}
                disabled={isStreaming || !input.trim()}
                className="w-10 h-10 rounded-lg bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center flex-shrink-0 transition-colors"
              >
                {isStreaming ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
