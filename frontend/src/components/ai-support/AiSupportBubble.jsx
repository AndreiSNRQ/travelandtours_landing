
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supportChatPrivate, supportChatPublic } from "@/api/supportChat";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

function safeNowId() {
  // stable-ish id for the session; we keep it in localStorage
  return (crypto?.randomUUID?.() || `conv_${Date.now()}_${Math.random().toString(16).slice(2)}`);
}

export default function AiSupportBubble() {
  const { auth, loading } = useAuth();

  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => [
    {
      role: "assistant",
      content:
        "Hi! I’m JoliTravel Support. Ask me about tours, inclusions, schedule, or your booking status (if you’re logged in).",
    },
  ]);

  const scrollRef = useRef(null);

  const conversationId = useMemo(() => {
    const key = "joli_support_conversation_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = safeNowId();
    localStorage.setItem(key, created);
    return created;
  }, []);

  const pageContext = useMemo(() => {
    // Optional: send current page path for better context
    return window.location?.pathname || "/";
  }, []);

  useEffect(() => {
    if (!open) return;
    // scroll to bottom when opened
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 0);
  }, [open]);

  useEffect(() => {
    // scroll on message changes
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function sendMessage(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) return;

    setSending(true);
    setInput("");

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);

    try {
      const payload = {
        message: trimmed,
        conversation_id: conversationId,
        page_context: pageContext,
      };

      // If user is logged-in -> private (can answer booking status)
      const data =
        !loading && auth
          ? await supportChatPrivate(payload)
          : await supportChatPublic(payload);

          const replyRaw =
            data?.reply ??
            data?.message ??
            data?.data?.reply ??
            data?.choices?.[0]?.message?.content ??
            "";

          const reply = String(replyRaw).trim() || "Sorry—support chat is temporarily unavailable. Please try again in a moment.";

          setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry—support chat is temporarily unavailable. Please try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (sending) return;
    sendMessage(input);
  }

  return (
    <>
      {/* Floating bubble button */}
      <div className="fixed bottom-5 right-5 z-[9999]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="h-14 w-14 rounded-full shadow-lg bg-black text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition"
          aria-label="Open support chat"
          title="Support Chat"
        >
          {/* simple chat icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M8 9h8M8 13h5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[9999] w-[92vw] max-w-sm rounded-2xl border bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex flex-col">
              <span className="font-semibold text-sm">JoliTravel Support</span>
              <span className="text-xs text-gray-500">
                {(!loading && auth) ? "Logged in: booking-aware" : "Guest: general help"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div
            ref={scrollRef}
            className="h-[55vh] max-h-[420px] overflow-y-auto px-4 py-3 space-y-3"
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-2xl px-3 py-2 text-sm">
                  Typing…
                </div>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t p-3 flex gap-2">
            <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question…"
            disabled={sending}
            className="
                flex-1 h-10 rounded-xl px-3 text-sm outline-none
                border border-input bg-background text-foreground
                placeholder:text-muted-foreground
                focus:ring-2 focus:ring-ring/30
                disabled:opacity-60
            "
            />

            <Button type="submit" disabled={sending || !input.trim()}>
              Send
            </Button>
          </form>

          <div className="px-4 pb-3 text-[11px] text-gray-500">
            Tip: Ask “What’s included?”, “Pickup time?”, or “Is my booking approved?”
          </div>
        </div>
      )}
    </>
  );
}
