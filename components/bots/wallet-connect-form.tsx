"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WalletConnectForm({ isElite }: { isElite: boolean }) {
  const router = useRouter();
  const [hlAddress, setHlAddress] = useState("");
  const [hlApiKey, setHlApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "connecting" | "success" | "error">("idle");
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const botPrice = isElite ? 45 : 98;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("connecting");
    setError(null);

    try {
      const res = await fetch("/api/bots/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hl_address: hlAddress, hl_api_key: hlApiKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Eroare la conectare.");
        setStatus("error");
        return;
      }

      setBalance(data.balance);
      setStatus("success");

      // Redirect to dashboard after 3 seconds
      setTimeout(() => router.push("/bots/dashboard"), 3000);
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent-emerald bg-accent-emerald/10">
          <span className="text-4xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Conectat cu succes!</h2>
        <p className="mt-3 text-slate-300">
          Balanță detectată: <span className="font-bold text-accent-emerald">${balance?.toFixed(2)}</span>
        </p>
        <p className="mt-2 text-sm text-slate-400">Botul va începe să copieze tranzacțiile automat.</p>
        <p className="mt-4 text-xs text-slate-500">Redirecționare către dashboard...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Pricing reminder */}
      <div className="mb-6 rounded-2xl border border-accent-emerald/30 bg-accent-emerald/5 px-5 py-4 text-center">
        <p className="text-sm text-slate-300">
          Bot AI Trading: <span className="font-bold text-accent-emerald">${botPrice}/lună</span>
          {isElite && <span className="ml-2 text-xs text-green-400">(discount Elite activ)</span>}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="panel p-6 md:p-8">
        <h2 className="mb-6 text-xl font-bold text-white">Conectează Wallet Hyperliquid</h2>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald" htmlFor="hl_address">
              Adresa Wallet Hyperliquid
            </label>
            <input
              id="hl_address"
              type="text"
              placeholder="0x..."
              value={hlAddress}
              onChange={(e) => setHlAddress(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
            />
            <p className="mt-1 text-xs text-slate-500">Adresa principală a contului tău Hyperliquid</p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald" htmlFor="hl_api_key">
              API Wallet Private Key
            </label>
            <input
              id="hl_api_key"
              type="password"
              placeholder="0x..."
              value={hlApiKey}
              onChange={(e) => setHlApiKey(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
            />
            <p className="mt-1 text-xs text-slate-500">Generează din Hyperliquid → API → Create API Wallet (trade only, fără withdraw)</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-accent-emerald/20 bg-accent-emerald/5 p-4">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-accent-emerald">Securitate:</span>{" "}
            API wallet-ul permite DOAR plasarea de ordine. NU avem acces la fondurile tale. Cheile sunt criptate AES-256.
          </p>
        </div>

        <button
          type="submit"
          disabled={status === "connecting"}
          className="accent-button mt-6 w-full py-3 font-bold disabled:opacity-60"
        >
          {status === "connecting" ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-crypto-dark border-t-transparent" />
              Se verifică conexiunea...
            </span>
          ) : (
            "Conectează și Verifică"
          )}
        </button>
      </form>

      {/* Referral reminder */}
      <div className="mt-6 panel p-5 text-center">
        <p className="text-sm text-slate-400">Nu ai cont Hyperliquid?</p>
        <a
          href="https://app.hyperliquid.xyz/join/ALEXCOSTEA"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent-emerald hover:text-accent-soft"
        >
          Creează cont cu link-ul de referral →
        </a>
      </div>
    </div>
  );
}
