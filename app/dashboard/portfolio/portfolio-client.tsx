"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type Holding = {
  id: string;
  asset_type: "crypto" | "stock" | "cash";
  ticker: string;
  quantity: number;
  entry_price: number;
  note: string | null;
  created_at: string;
};

type CryptoQuote = { symbol: string; price: number; change24h: number };
type StockQuote = { ticker: string; price: number; changePct: number };

const ASSET_LABEL: Record<Holding["asset_type"], string> = {
  crypto: "Crypto",
  stock: "Acțiune",
  cash: "Cash",
};

function fmtUsd(n: number): string {
  return n.toLocaleString("ro-RO", { style: "currency", currency: "USD", maximumFractionDigits: n >= 100 ? 0 : 2 });
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function PortfolioClient({ initialHoldings }: { initialHoldings: Holding[] }) {
  const [holdings, setHoldings] = useState<Holding[]>(initialHoldings);
  const [cryptoMap, setCryptoMap] = useState<Map<string, number>>(new Map());
  const [stockMap, setStockMap] = useState<Map<string, number>>(new Map());
  const [pricesLoading, setPricesLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        fetch("/api/crypto").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/stocks").then((r) => r.json()).catch(() => ({ stocks: [] })),
      ]);
      const cm = new Map<string, number>();
      const cArr: CryptoQuote[] = Array.isArray(cRes.data) ? cRes.data : Array.isArray(cRes.crypto) ? cRes.crypto : [];
      for (const c of cArr) cm.set((c.symbol ?? "").toUpperCase(), c.price);
      setCryptoMap(cm);

      const sm = new Map<string, number>();
      const sArr: StockQuote[] = Array.isArray(sRes.stocks) ? sRes.stocks : [];
      for (const s of sArr) sm.set((s.ticker ?? "").toUpperCase(), s.price);
      setStockMap(sm);
    } finally {
      setPricesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 120_000);
    return () => clearInterval(id);
  }, [fetchPrices]);

  const enriched = useMemo(() => {
    return holdings.map((h) => {
      let livePrice: number | null = null;
      if (h.asset_type === "crypto") livePrice = cryptoMap.get(h.ticker.toUpperCase()) ?? null;
      else if (h.asset_type === "stock") livePrice = stockMap.get(h.ticker.toUpperCase()) ?? null;
      else if (h.asset_type === "cash") livePrice = 1;

      const currentValue = livePrice != null ? livePrice * h.quantity : null;
      const investedValue = h.entry_price * h.quantity;
      const pnlUsd = currentValue != null ? currentValue - investedValue : null;
      const pnlPct = currentValue != null && investedValue > 0 ? ((currentValue - investedValue) / investedValue) * 100 : null;

      return { ...h, livePrice, currentValue, investedValue, pnlUsd, pnlPct };
    });
  }, [holdings, cryptoMap, stockMap]);

  const totals = useMemo(() => {
    let invested = 0;
    let current = 0;
    let unknownTickers = 0;
    for (const e of enriched) {
      invested += e.investedValue;
      if (e.currentValue != null) current += e.currentValue;
      else unknownTickers++;
    }
    const pnlUsd = current - invested;
    const pnlPct = invested > 0 ? (pnlUsd / invested) * 100 : 0;
    return { invested, current, pnlUsd, pnlPct, unknownTickers };
  }, [enriched]);

  const addHolding = async (form: AddFormValues) => {
    setError(null);
    setAdding(true);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Eroare la salvare");
        return false;
      }
      setHoldings((prev) => [data.holding as Holding, ...prev]);
      return true;
    } catch {
      setError("Eroare de rețea");
      return false;
    } finally {
      setAdding(false);
    }
  };

  const removeHolding = async (id: string) => {
    const prev = holdings;
    setHoldings((cur) => cur.filter((h) => h.id !== id));
    const res = await fetch(`/api/portfolio?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      setHoldings(prev);
      setError("Nu s-a putut șterge poziția");
    }
  };

  return (
    <div className="space-y-6">
      {/* Totals */}
      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Investit" value={fmtUsd(totals.invested)} tone="neutral" />
        <SummaryCard
          label="Valoare Curentă"
          value={pricesLoading ? "…" : fmtUsd(totals.current)}
          tone="neutral"
          sub={totals.unknownTickers > 0 ? `${totals.unknownTickers} ticker fără preț live` : undefined}
        />
        <SummaryCard
          label="P&L"
          value={pricesLoading ? "…" : fmtUsd(totals.pnlUsd)}
          tone={totals.pnlUsd > 0 ? "pos" : totals.pnlUsd < 0 ? "neg" : "neutral"}
        />
        <SummaryCard
          label="Randament"
          value={pricesLoading ? "…" : fmtPct(totals.pnlPct)}
          tone={totals.pnlPct > 0 ? "pos" : totals.pnlPct < 0 ? "neg" : "neutral"}
        />
      </section>

      {/* Add form */}
      <AddForm onSubmit={addHolding} disabled={adding} />
      {error ? <p className="text-sm text-rose-400">⚠️ {error}</p> : null}

      {/* Holdings list */}
      <section className="glass-card rounded-2xl border border-white/10 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="section-label mb-1">Pozițiile Tale</p>
            <h2 className="text-lg font-bold text-white">{holdings.length} {holdings.length === 1 ? "poziție" : "poziții"}</h2>
          </div>
          <p className="text-xs text-slate-500">{pricesLoading ? "Se încarcă prețurile…" : "Prețuri actualizate la 2 minute"}</p>
        </div>
        {holdings.length === 0 ? (
          <p className="text-sm text-slate-500">Niciun activ încă. Adaugă mai sus prima ta poziție.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="py-2">Ticker</th>
                  <th className="py-2">Tip</th>
                  <th className="py-2 text-right">Cantitate</th>
                  <th className="py-2 text-right">Intrare</th>
                  <th className="py-2 text-right">Live</th>
                  <th className="py-2 text-right">Valoare</th>
                  <th className="py-2 text-right">P&L</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 font-bold text-white">{e.ticker}</td>
                    <td className="py-3 text-slate-400">{ASSET_LABEL[e.asset_type]}</td>
                    <td className="py-3 text-right font-data tabular-nums text-slate-300">
                      {e.quantity.toLocaleString("ro-RO", { maximumFractionDigits: 8 })}
                    </td>
                    <td className="py-3 text-right font-data tabular-nums text-slate-300">{fmtUsd(e.entry_price)}</td>
                    <td className="py-3 text-right font-data tabular-nums text-slate-300">
                      {e.livePrice != null ? fmtUsd(e.livePrice) : "—"}
                    </td>
                    <td className="py-3 text-right font-data tabular-nums text-white">
                      {e.currentValue != null ? fmtUsd(e.currentValue) : "—"}
                    </td>
                    <td className="py-3 text-right font-data tabular-nums">
                      {e.pnlPct != null ? (
                        <span className={e.pnlPct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          {fmtPct(e.pnlPct)}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeHolding(e.id)}
                        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-400 transition hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-300"
                        aria-label={`Șterge ${e.ticker}`}
                      >
                        Șterge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-slate-600">
        🔒 Datele sunt private și legate de contul tău. Prețurile crypto vin de la CoinGecko, acțiunile de la Finviz.
        Tracker-ul este informativ, nu sfat financiar.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "pos" | "neg" | "neutral";
}) {
  const color = tone === "pos" ? "text-emerald-400" : tone === "neg" ? "text-rose-400" : "text-white";
  return (
    <div className="glass-card rounded-xl border border-white/10 p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-data text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

type AddFormValues = {
  asset_type: Holding["asset_type"];
  ticker: string;
  quantity: number;
  entry_price: number;
  note?: string;
};

function AddForm({ onSubmit, disabled }: { onSubmit: (v: AddFormValues) => Promise<boolean>; disabled: boolean }) {
  const [assetType, setAssetType] = useState<Holding["asset_type"]>("crypto");
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [note, setNote] = useState("");

  const onSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(quantity);
    const p = Number(entryPrice);
    if (!ticker.trim() || !Number.isFinite(q) || q <= 0 || !Number.isFinite(p) || p < 0) return;
    const ok = await onSubmit({
      asset_type: assetType,
      ticker: ticker.trim().toUpperCase(),
      quantity: q,
      entry_price: p,
      note: note.trim() || undefined,
    });
    if (ok) {
      setTicker("");
      setQuantity("");
      setEntryPrice("");
      setNote("");
    }
  };

  return (
    <section className="glass-card rounded-2xl border border-white/10 p-6">
      <p className="section-label mb-1">Adaugă poziție</p>
      <h2 className="mb-4 text-lg font-bold text-white">Poziție nouă</h2>
      <form onSubmit={onSubmitForm} className="grid gap-3 md:grid-cols-[120px,1fr,1fr,1fr,auto]">
        <select
          value={assetType}
          onChange={(e) => setAssetType(e.target.value as Holding["asset_type"])}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald-400/40 focus:outline-none"
        >
          <option value="crypto">Crypto</option>
          <option value="stock">Acțiune</option>
          <option value="cash">Cash</option>
        </select>
        <input
          type="text"
          placeholder="Ticker (ex: BTC, AAPL)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          maxLength={16}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none"
        />
        <input
          type="number"
          step="any"
          min="0"
          placeholder="Cantitate"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none"
        />
        <input
          type="number"
          step="any"
          min="0"
          placeholder={assetType === "cash" ? "1" : "Preț intrare USD"}
          value={entryPrice}
          onChange={(e) => setEntryPrice(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? "..." : "Adaugă"}
        </button>
        <input
          type="text"
          placeholder="Notă (opțional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none md:col-span-5"
        />
      </form>
      <p className="mt-3 text-xs text-slate-600">
        Pentru crypto folosește simbolul (BTC, ETH, SOL). Pentru cash, prețul de intrare este 1 (USD = USD).
      </p>
    </section>
  );
}
