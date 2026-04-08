"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const riskLevels = [
  { value: "0.5", label: "Conservator", description: "0.5% risc per trade" },
  { value: "1.0", label: "Moderat", description: "1% risc per trade" },
  { value: "1.5", label: "Agresiv", description: "1.5% risc per trade" },
  { value: "2.0", label: "Ultra", description: "2% risc per trade" },
];

export function MexcConnectForm({ isElite }: { isElite: boolean }) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [riskLevel, setRiskLevel] = useState("1.0");
  const [status, setStatus] = useState<"idle" | "connecting" | "success" | "error">("idle");
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
        body: JSON.stringify({
          api_key: apiKey,
          api_secret: apiSecret,
          passphrase: passphrase || undefined,
          risk_level: parseFloat(riskLevel),
          exchange: "MEXC",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Eroare la conectare.");
        setStatus("error");
        return;
      }

      setStatus("success");
      setTimeout(() => router.push("/bots/dashboard"), 2500);
    } catch {
      setError("Eroare de retea. Incearca din nou.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent-emerald bg-accent-emerald/10">
          <span className="text-4xl text-accent-emerald">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Conectat cu succes!</h2>
        <p className="mt-3 text-slate-300">
          Contul tau MEXC a fost conectat. Abonamentul este in asteptare pentru activare.
        </p>
        <p className="mt-4 text-xs text-slate-500">Redirectionare catre dashboard...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Exchange badge + pricing */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-4 py-1.5 text-sm font-semibold text-accent-emerald">
          <span>🏦</span> MEXC Exchange
        </div>
        <div className="rounded-xl border border-accent-emerald/30 bg-accent-emerald/5 px-4 py-2 text-center">
          <p className="text-sm text-slate-300">
            Bot Trading: <span className="font-bold text-accent-emerald">${botPrice}/luna</span>
            {isElite && <span className="ml-2 text-xs text-green-400">(discount Elite activ)</span>}
          </p>
        </div>
      </div>

      {/* API Key Instructions */}
      <div className="panel mb-6 p-6">
        <h3 className="mb-4 font-bold text-white">Cum creezi un API Key pe MEXC</h3>
        <ol className="space-y-3 text-sm text-slate-300">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-emerald/20 text-xs font-bold text-accent-emerald">1</span>
            <span>Intra in contul tau MEXC si mergi la <span className="font-semibold text-white">Account &gt; API Management</span></span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-emerald/20 text-xs font-bold text-accent-emerald">2</span>
            <span>Apasa <span className="font-semibold text-white">Create API Key</span> si seteaza un nume (ex: &quot;Bot Trading&quot;)</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-emerald/20 text-xs font-bold text-accent-emerald">3</span>
            <span>Activeaza permisiunile: <span className="font-semibold text-accent-emerald">Read</span> + <span className="font-semibold text-accent-emerald">Trade</span></span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-400">!</span>
            <span className="text-red-300">NU activa permisiunea de <span className="font-semibold">Withdrawal</span>. Botul nu are nevoie de ea.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-emerald/20 text-xs font-bold text-accent-emerald">4</span>
            <span>Copiaza <span className="font-semibold text-white">API Key</span>, <span className="font-semibold text-white">Secret Key</span> si (optional) <span className="font-semibold text-white">Passphrase</span> si introdu-le mai jos</span>
          </li>
        </ol>
      </div>

      {/* Connect Form */}
      <form onSubmit={handleSubmit} className="panel p-6 md:p-8">
        <h2 className="mb-6 text-xl font-bold text-white">Conecteaza contul MEXC</h2>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* API Key */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald" htmlFor="api_key">
              API Key
            </label>
            <input
              id="api_key"
              type="text"
              placeholder="mx0v..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
            />
            <p className="mt-1 text-xs text-slate-500">Access Key-ul generat din MEXC API Management</p>
          </div>

          {/* API Secret */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald" htmlFor="api_secret">
              Secret Key
            </label>
            <input
              id="api_secret"
              type="password"
              placeholder="••••••••••"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
            />
            <p className="mt-1 text-xs text-slate-500">Secret Key-ul asociat API-ului tau MEXC</p>
          </div>

          {/* Passphrase */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald" htmlFor="passphrase">
              Passphrase <span className="normal-case tracking-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="passphrase"
              type="password"
              placeholder="••••••••••"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
            />
            <p className="mt-1 text-xs text-slate-500">Doar daca ai setat un passphrase la crearea API-ului</p>
          </div>

          {/* Risk Level */}
          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
              Nivel de Risc
            </label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {riskLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setRiskLevel(level.value)}
                  className={`rounded-xl border px-3 py-3 text-center transition ${
                    riskLevel === level.value
                      ? "border-accent-emerald bg-accent-emerald/10 text-white"
                      : "border-white/10 bg-surface-graphite text-slate-400 hover:border-white/20"
                  }`}
                >
                  <p className="text-sm font-bold">{level.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{level.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="mt-6 rounded-xl border border-accent-emerald/20 bg-accent-emerald/5 p-4">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-accent-emerald">Securitate:</span>{" "}
            Cheile API sunt criptate AES-256 si stocate in siguranta. Botul poate doar sa citeasca si sa tranzactioneze. NU are acces la retrageri.
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
              Se conecteaza...
            </span>
          ) : (
            "Conecteaza si Activeaza"
          )}
        </button>
      </form>
    </div>
  );
}
