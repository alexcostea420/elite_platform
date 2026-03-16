"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type ConnectDiscordCardProps = {
  discordAvatar: string | null;
  discordConnectedAt: string | null;
  discordRoleLabel: string;
  discordRoleSyncedAt: string | null;
  discordUsername: string | null;
  isConnected: boolean;
  notice: string | null;
  noticeTone: "success" | "error" | null;
};

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return "Încă neconfirmat";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function ConnectDiscordCard({
  discordAvatar,
  discordConnectedAt,
  discordRoleLabel,
  discordRoleSyncedAt,
  discordUsername,
  isConnected,
  notice,
  noticeTone,
}: ConnectDiscordCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isModalOpen]);

  return (
    <>
      <article className="panel px-6 py-8 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Setări Discord</p>
            <h3 className="mt-3 text-2xl font-bold text-white">Conectează contul tău Discord la platformă</h3>
            <p className="mt-3 text-slate-300">
              După conectare, platforma citește identitatea ta Discord și sincronizează automat rolul corect în server:
              <span className="font-semibold text-white"> Elite</span> pentru membri plătiți și
              <span className="font-semibold text-white"> Soldat</span> pentru accesul Free.
            </p>
          </div>
          <button
            className="accent-button whitespace-nowrap"
            onClick={() => setIsModalOpen(true)}
            type="button"
          >
            {isConnected ? "Reconectează Discord" : "Conectează Discord"}
          </button>
        </div>

        {notice ? (
          <div
            className={`mt-5 rounded-2xl px-4 py-4 text-sm ${
              noticeTone === "error"
                ? "border border-red-500/30 bg-red-500/10 text-red-100"
                : "border border-crypto-green/30 bg-crypto-green/10 text-slate-100"
            }`}
          >
            {notice}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Status conectare</p>
            <div className="mt-3 flex items-center gap-3">
              {discordAvatar ? (
                <Image
                  alt={discordUsername ? `Avatar Discord pentru ${discordUsername}` : "Avatar Discord"}
                  className="rounded-full border border-white/10 object-cover"
                  height={48}
                  src={discordAvatar}
                  width={48}
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-slate-300">
                  💬
                </div>
              )}
              <div>
                <p className="font-semibold text-white">{discordUsername ?? "Nu ai conectat încă Discord"}</p>
                <p className="text-sm text-slate-400">
                  {isConnected ? `Conectat la ${formatTimestamp(discordConnectedAt)}` : "Conectează Discord pentru acces automat"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Rol sincronizat</p>
            <h4 className="mt-3 text-2xl font-bold text-white">{discordRoleLabel}</h4>
            <p className="mt-2 text-sm text-slate-400">
              {isConnected
                ? `Ultima sincronizare: ${formatTimestamp(discordRoleSyncedAt)}`
                : "Rolul se sincronizează după ce termini conectarea."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Ce primești</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Free primește un singur chat gratuit. Elite deblochează analize zilnice, trade ideas, portofoliu Elite, unelte exclusive și indicatorul dedicat.
            </p>
          </div>
        </div>
      </article>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm">
          <button
            aria-label="Închide conectarea Discord"
            className="absolute inset-0"
            onClick={() => setIsModalOpen(false)}
            type="button"
          />
          <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-surface-graphite shadow-glow">
            <div className="border-b border-white/10 px-5 py-4 md:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-emerald">Conectare Discord</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Alege clar ce nivel de acces vrei să vezi în comunitate</h2>
            </div>
            <div className="space-y-4 p-5 md:p-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Free / Soldat</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Accesul gratuit include doar chatul Free și punctul de intrare în comunitate.
                </p>
              </div>
              <div className="rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-emerald">Elite</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">
                  Elite include analize zilnice, trade ideas, portofoliu Elite, unelte exclusive, indicatorul dedicat și accesul complet la contextul premium.
                </p>
              </div>
              <p className="text-sm text-slate-400">
                După conectare, rolul tău este sincronizat automat pe baza nivelului din platformă. Nu trebuie să introduci manual ID-ul de Discord.
              </p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  className="ghost-button"
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                >
                  Anulează
                </button>
                <Link
                  className="accent-button"
                  href="/auth/discord/start"
                  onClick={() => setIsModalOpen(false)}
                >
                  Continuă spre Discord
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
