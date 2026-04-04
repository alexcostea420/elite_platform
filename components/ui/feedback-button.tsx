"use client";

import { useState, useEffect } from "react";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"bug" | "feature" | "general">("bug");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "cooldown" | "error">("idle");

  useEffect(() => {
    const lastSent = localStorage.getItem("feedback_last_sent");
    if (lastSent) {
      const diff = Date.now() - parseInt(lastSent, 10);
      if (diff < 24 * 60 * 60 * 1000) {
        setStatus("cooldown");
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("sending");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message, page_url: window.location.href }),
      });

      if (res.ok) {
        setStatus("sent");
        setMessage("");
        localStorage.setItem("feedback_last_sent", Date.now().toString());
        setTimeout(() => { setOpen(false); setStatus("cooldown"); }, 2000);
      } else {
        const data = await res.json();
        if (data.error?.includes("24")) {
          setStatus("cooldown");
        } else {
          setStatus("error");
        }
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-surface-graphite shadow-lg transition hover:border-accent-emerald hover:shadow-glow"
        title="Feedback"
        type="button"
      >
        <span className="text-lg">💬</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6 sm:items-center sm:justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface-graphite p-6 shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
              type="button"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-white">Feedback / Bug Report</h3>
            <p className="mt-1 text-sm text-slate-400">Trimite-ne un mesaj. Alex il va vedea.</p>

            {status === "sent" ? (
              <div className="mt-4 rounded-xl border border-green-400/30 bg-green-400/10 p-4 text-center text-green-400">
                Multumim! Feedback-ul a fost trimis. ✅
              </div>
            ) : status === "cooldown" ? (
              <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-center text-yellow-400">
                Ai trimis deja feedback in ultimele 24 ore. Revino maine!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="flex gap-2">
                  {(["bug", "feature", "general"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${type === t ? "bg-accent-emerald text-crypto-dark" : "border border-white/10 text-slate-400 hover:text-white"}`}
                    >
                      {t === "bug" ? "🐛 Bug" : t === "feature" ? "💡 Idee" : "💬 General"}
                    </button>
                  ))}
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descrie bug-ul sau sugestia ta..."
                  required
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-crypto-dark px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="accent-button w-full py-3 font-bold disabled:opacity-60"
                >
                  {status === "sending" ? "Se trimite..." : "Trimite Feedback"}
                </button>
                {status === "error" && (
                  <p className="text-center text-sm text-red-400">Eroare. Incearca din nou.</p>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
