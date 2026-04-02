"use client";

import { useState, useEffect, useCallback } from "react";

type PlanDuration = "30_days" | "90_days" | "365_days";

type PaymentData = {
  payment_id: string;
  wallet_address: string;
  amount: number;
  currency: string;
  chain: string;
  chain_label: string;
  expires_in_minutes: number;
  status: string;
};

type PaymentStatus = {
  status: string;
  tx_hash: string | null;
  confirmed_at: string | null;
  expires_at: string | null;
};

type ChainOption = {
  chain: string;
  label: string;
};

const planLabels: Record<PlanDuration, string> = {
  "30_days": "30 Zile",
  "90_days": "3 Luni",
  "365_days": "12 Luni",
};

const chainOptions: ChainOption[] = [
  { chain: "TRC-20", label: "Tron (TRC-20)" },
  { chain: "ARB", label: "Arbitrum" },
  { chain: "SOL", label: "Solana" },
  { chain: "ERC-20", label: "Ethereum (ERC-20)" },
];

function formatAmount(amount: number): string {
  return amount.toFixed(3);
}

export function PaymentFlow() {
  const [step, setStep] = useState<"select" | "pay" | "checking" | "confirmed" | "error">("select");
  const [selectedPlan, setSelectedPlan] = useState<PlanDuration | null>(null);
  const [selectedChain, setSelectedChain] = useState<string>("TRC-20");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);
  const [enabledChains, setEnabledChains] = useState<ChainOption[]>([]);

  // Fetch enabled chains on mount
  useEffect(() => {
    fetch("/api/payments/chains")
      .then((res) => res.json())
      .then((data) => {
        if (data.chains && data.chains.length > 0) {
          setEnabledChains(data.chains);
          setSelectedChain(data.chains[0].chain);
        }
      })
      .catch(() => {
        // Fallback to TRC-20 only
        setEnabledChains([{ chain: "TRC-20", label: "Tron (TRC-20)" }]);
      });
  }, []);

  const createPayment = async (plan: PlanDuration) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_duration: plan, chain: selectedChain }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Eroare la creare cerere de plată.");
        setStep("error");
        return;
      }

      const chainLabel = chainOptions.find((c) => c.chain === data.chain)?.label ?? data.chain;
      setPaymentData({ ...data, chain_label: chainLabel });
      setSelectedPlan(plan);
      setStep("pay");
    } catch {
      setError("Eroare de conexiune. Încearcă din nou.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = useCallback(async () => {
    if (!paymentData) return;

    try {
      const res = await fetch(`/api/payments/status?id=${paymentData.payment_id}`);
      const data = await res.json();

      if (data.status === "confirmed") {
        setPaymentStatus(data);
        setStep("confirmed");
      } else if (data.status === "expired") {
        setError("Timpul de plată a expirat. Creează o nouă cerere.");
        setStep("error");
      }
    } catch {
      // Silent retry on next interval
    }
  }, [paymentData]);

  // Poll for payment status every 15 seconds when in "pay" or "checking" step
  useEffect(() => {
    if (step !== "pay" && step !== "checking") return;

    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [step, checkStatus]);

  const copyToClipboard = async (text: string, type: "address" | "amount") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  if (step === "confirmed") {
    return (
      <section className="panel border-accent-emerald/30 px-6 py-8 text-center md:px-8">
        <div className="text-5xl">✅</div>
        <h2 className="mt-4 text-3xl font-bold text-white">Plata confirmată!</h2>
        <p className="mt-3 text-slate-300">
          Accesul tău Elite a fost activat{paymentStatus?.expires_at
            ? ` până pe ${new Date(paymentStatus.expires_at).toLocaleDateString("ro-RO")}`
            : ""}.
        </p>
        {paymentStatus?.tx_hash ? (
          <p className="mt-2 text-sm text-slate-500">
            TX: {paymentStatus.tx_hash.slice(0, 16)}...{paymentStatus.tx_hash.slice(-8)}
          </p>
        ) : null}
        <a
          className="accent-button mt-6 inline-block"
          href="/dashboard"
        >
          Mergi la Dashboard
        </a>
      </section>
    );
  }

  if (step === "error") {
    return (
      <section className="panel border-red-500/30 px-6 py-8 text-center md:px-8">
        <div className="text-5xl">⚠️</div>
        <h2 className="mt-4 text-2xl font-bold text-white">Eroare la plată</h2>
        <p className="mt-3 text-slate-300">{error}</p>
        <button
          className="accent-button mt-6"
          onClick={() => {
            setStep("select");
            setError(null);
            setPaymentData(null);
          }}
          type="button"
        >
          Încearcă din nou
        </button>
      </section>
    );
  }

  if (step === "pay" && paymentData && selectedPlan) {
    return (
      <section className="panel border-accent-emerald/30 px-6 py-8 md:px-8">
        <div className="mb-6 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
            Plată în curs
          </p>
          <h2 className="text-3xl font-bold text-white">
            Trimite exact {formatAmount(paymentData.amount)} {paymentData.currency}
          </h2>
          <p className="mt-2 text-slate-400">
            Plan: {planLabels[selectedPlan]} | Rețea: {paymentData.chain_label}
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Adresa wallet ({paymentData.chain_label})
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 break-all text-sm font-mono text-white">
                {paymentData.wallet_address}
              </code>
              <button
                className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                onClick={() => copyToClipboard(paymentData.wallet_address, "address")}
                type="button"
              >
                {copied === "address" ? "Copiat!" : "Copiază"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Sumă exactă de trimis
            </p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-accent-emerald">
                {formatAmount(paymentData.amount)} {paymentData.currency}
              </span>
              <button
                className="shrink-0 rounded-xl border border-accent-emerald/30 px-3 py-2 text-sm text-accent-emerald hover:bg-accent-emerald/10"
                onClick={() => copyToClipboard(formatAmount(paymentData.amount), "amount")}
                type="button"
              >
                {copied === "amount" ? "Copiat!" : "Copiază"}
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Suma include un identificator unic. Trimite exact această sumă pentru detectarea automată.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
            <p className="font-semibold">Important:</p>
            <ul className="mt-2 space-y-1 text-amber-200/80">
              <li>- Trimite doar USDT pe rețeaua {paymentData.chain_label}</li>
              <li>- Trimite exact suma afișată (inclusiv zecimalele)</li>
              <li>- Ai la dispoziție 30 minute pentru a finaliza plata</li>
              <li>- Confirmarea este automată după detectarea tranzacției</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
          <div className="h-3 w-3 animate-pulse rounded-full bg-accent-emerald" />
          Se verifică automat... (la fiecare 15 secunde)
        </div>

        <div className="mt-4 text-center">
          <button
            className="text-sm text-slate-500 underline hover:text-slate-300"
            onClick={() => checkStatus()}
            type="button"
          >
            Verifică manual acum
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            className="ghost-button"
            onClick={() => {
              setStep("select");
              setPaymentData(null);
              setSelectedPlan(null);
            }}
            type="button"
          >
            Anulează și alege alt plan
          </button>
        </div>
      </section>
    );
  }

  // Step: select plan
  return (
    <section className="panel border-accent-emerald/30 px-6 py-8 md:px-8">
      <div className="mb-6 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
          Plată Crypto
        </p>
        <h2 className="text-3xl font-bold text-white">Alege planul și plătește cu USDT</h2>
        <p className="mt-2 text-slate-400">
          Selectează durata de acces. Plata se face în USDT
          {enabledChains.length === 1 ? ` pe rețeaua ${enabledChains[0].label}` : ""}.
        </p>
      </div>

      {enabledChains.length > 1 ? (
        <div className="mb-6">
          <p className="mb-3 text-center text-sm font-semibold text-slate-400">Alege rețeaua:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {enabledChains.map((c) => (
              <button
                key={c.chain}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  selectedChain === c.chain
                    ? "bg-accent-emerald text-crypto-dark"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
                onClick={() => setSelectedChain(c.chain)}
                type="button"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {(["30_days", "90_days", "365_days"] as PlanDuration[]).map((plan) => (
          <button
            key={plan}
            className={`rounded-2xl border p-6 text-left transition hover:border-accent-emerald/50 ${
              plan === "90_days"
                ? "border-accent-emerald/30 bg-accent-emerald/5"
                : "border-white/10 bg-white/5"
            }`}
            disabled={loading}
            onClick={() => createPayment(plan)}
            type="button"
          >
            <h3 className="text-xl font-bold text-white">{planLabels[plan]}</h3>
            <p className="mt-2 text-2xl font-bold text-accent-emerald">
              ${plan === "30_days" ? "49" : plan === "90_days" ? "137" : "497"}
            </p>
            <p className="mt-1 text-sm text-slate-400">USDT</p>
            {plan === "90_days" ? (
              <span className="mt-2 inline-block rounded-full bg-accent-emerald/20 px-3 py-1 text-xs font-semibold text-accent-emerald">
                Cel mai popular
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent-emerald border-t-transparent" />
          Se generează cererea de plată...
        </div>
      ) : null}
    </section>
  );
}
