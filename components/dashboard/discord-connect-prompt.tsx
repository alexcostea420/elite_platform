"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "discord_prompt_dismissed";

export function DiscordConnectPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  return (
    <section className="mb-6 rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/5 px-5 py-5 animate-fade-in-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5865F2]/20 text-lg">💬</div>
          <div>
            <p className="font-semibold text-white">Conectează-ți Discord-ul</p>
            <p className="mt-0.5 text-sm text-slate-400">Primești automat rolul Elite și acces la canalele private.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            className="inline-flex items-center gap-2 rounded-lg bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4752C4]"
            href="/auth/discord/start"
          >
            Conectează Discord
          </a>
          <button
            className="rounded-lg px-3 py-2.5 text-xs text-slate-500 hover:text-slate-300"
            onClick={dismiss}
            type="button"
          >
            Mai târziu
          </button>
        </div>
      </div>
    </section>
  );
}
