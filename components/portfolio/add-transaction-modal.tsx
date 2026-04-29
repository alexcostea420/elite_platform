"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ASSETS, getAsset } from "@/lib/portfolio/assets";

type CatalogAsset = {
  key: string;
  type: "crypto" | "stock" | "index";
  name: string;
  symbol: string;
  group: string;
};

const CATALOG: CatalogAsset[] = ASSETS.map((a) => ({
  key: a.key,
  type: a.type,
  name: a.name,
  symbol: a.symbol,
  group: a.group ?? "Other",
}));

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function AddTransactionModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [assetKey, setAssetKey] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [showList, setShowList] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [date, setDate] = useState<string>(todayIso());
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricePrefilling, setPricePrefilling] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? CATALOG.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.symbol.toLowerCase().includes(q),
        )
      : CATALOG;
    return list.slice(0, 80);
  }, [search]);

  const grouped = useMemo(() => {
    const out: Record<string, CatalogAsset[]> = {};
    for (const a of filtered) {
      (out[a.group] ??= []).push(a);
    }
    return out;
  }, [filtered]);

  const selectedAsset = assetKey ? getAsset(assetKey) : null;

  async function prefillPrice(targetAsset: string, targetDate: string) {
    if (!targetAsset || !targetDate) return;
    setPricePrefilling(true);
    try {
      const r = await fetch(
        `/api/portfolio/price?asset=${encodeURIComponent(targetAsset)}&date=${encodeURIComponent(targetDate)}`,
      );
      if (!r.ok) return;
      const j = await r.json();
      if (typeof j?.price_usd === "number" && j.price_usd > 0) {
        setPrice(String(j.price_usd));
      }
    } catch {
      // user can type the price manually
    } finally {
      setPricePrefilling(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!assetKey) {
      setError("Alege un asset.");
      return;
    }
    const q = Number(quantity);
    const p = Number(price);
    if (!Number.isFinite(q) || q <= 0) {
      setError("Cantitate invalidă.");
      return;
    }
    if (!Number.isFinite(p) || p < 0) {
      setError("Preț invalid.");
      return;
    }
    if (!date) {
      setError("Alege data.");
      return;
    }

    setSubmitting(true);
    try {
      const r = await fetch("/api/portfolio/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_key: assetKey,
          side,
          quantity: q,
          price_usd: p,
          occurred_on: date,
          notes: notes.trim() || undefined,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(`Eroare: ${j.error || "salvare eșuată"}`);
        return;
      }
      onAdded();
    } catch {
      setError("Eroare de rețea.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0D1117] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Tranzacție nouă
            </p>
            <h2 className="text-lg font-bold text-white">Adaugă în portofoliu</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Închide"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide("BUY")}
              className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                side === "BUY"
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                  : "border-white/10 bg-white/[0.02] text-slate-500 hover:text-slate-300"
              }`}
            >
              Cumpărare
            </button>
            <button
              type="button"
              onClick={() => setSide("SELL")}
              className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                side === "SELL"
                  ? "border-rose-400/40 bg-rose-400/10 text-rose-300"
                  : "border-white/10 bg-white/[0.02] text-slate-500 hover:text-slate-300"
              }`}
            >
              Vânzare
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Asset
            </label>
            {selectedAsset ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-white">
                    {selectedAsset.symbol}{" "}
                    <span className="ml-1 text-xs text-slate-500">
                      {selectedAsset.name}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedAsset.group}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAssetKey("");
                    setSearch("");
                    setShowList(true);
                    setTimeout(() => searchRef.current?.focus(), 50);
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Schimbă
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Caută... (ex: BTC, AAPL, BET)"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowList(true);
                  }}
                  onFocus={() => setShowList(true)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none"
                />
                {showList ? (
                  <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-black/60">
                    {Object.entries(grouped).map(([group, items]) => (
                      <div key={group}>
                        <p className="sticky top-0 bg-black/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {group}
                        </p>
                        {items.map((a) => (
                          <button
                            key={a.key}
                            type="button"
                            onClick={() => {
                              setAssetKey(a.key);
                              setSearch("");
                              setShowList(false);
                              if (date) void prefillPrice(a.key, date);
                            }}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-white/5"
                          >
                            <span>
                              <span className="font-bold text-white">{a.symbol}</span>
                              <span className="ml-2 text-xs text-slate-500">
                                {a.name}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                    {filtered.length === 0 ? (
                      <p className="px-3 py-4 text-center text-sm text-slate-500">
                        Niciun rezultat.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Cantitate
              </label>
              <input
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                placeholder="ex: 10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Preț per unitate (USD){" "}
                {pricePrefilling ? (
                  <span className="text-[10px] font-normal text-slate-500">
                    se completează…
                  </span>
                ) : null}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                placeholder="ex: 2160"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Data
            </label>
            <input
              type="date"
              value={date}
              max={todayIso()}
              onChange={(e) => {
                setDate(e.target.value);
                if (assetKey && !price) void prefillPrice(assetKey, e.target.value);
              }}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-emerald-400/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Notă (opțional)
            </label>
            <input
              type="text"
              maxLength={300}
              placeholder="ex: zona buy semnalată în Crypto Dashboard"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Se salvează…" : "Salvează"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
