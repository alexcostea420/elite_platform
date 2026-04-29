"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CalculatorPanel,
  type CalculatorDraft,
} from "@/components/journal/calculator-panel";

type Trade = {
  id: string;
  symbol: string;
  direction: "long" | "short";
  entry: number;
  exit: number | null;
  stop: number | null;
  qty: number;
  riskAmount: number | null;
  leverage: number;
  date: string; // ISO date YYYY-MM-DD
  notes: string;
  tags: string[];
  status: "open" | "win" | "loss" | "breakeven";
  pnl: number | null; // computed when closed
  rMultiple: number | null;
  createdAt: string;
};

const STORAGE_KEY = "trading_journal_v1";

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function fmtPct(n: number | null | undefined, withSign = true): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = withSign && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function computePnl(t: Pick<Trade, "direction" | "entry" | "exit" | "qty">): number | null {
  if (t.exit == null || !Number.isFinite(t.exit) || !Number.isFinite(t.entry)) return null;
  const diff = t.direction === "long" ? t.exit - t.entry : t.entry - t.exit;
  return diff * t.qty;
}

function computeR(t: Trade): number | null {
  if (t.pnl == null || t.riskAmount == null || t.riskAmount <= 0) return null;
  return t.pnl / t.riskAmount;
}

function loadTrades(): Trade[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Trade[];
  } catch {
    return [];
  }
}

function saveTrades(trades: Trade[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  } catch {
    // localStorage full / blocked — nothing to do
  }
}

function exportJson(trades: Trade[]) {
  const blob = new Blob([JSON.stringify(trades, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `journal_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function JournalClient() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string>("");
  const [draftFromCalc, setDraftFromCalc] = useState<CalculatorDraft | null>(null);

  useEffect(() => {
    setTrades(loadTrades());
  }, []);

  const openDraftFromCalc = (draft: CalculatorDraft) => {
    setEditId(null);
    setDraftFromCalc(draft);
    setShowAdd(true);
  };

  const upsertTrade = (t: Trade) => {
    setTrades((prev) => {
      const next = prev.find((x) => x.id === t.id)
        ? prev.map((x) => (x.id === t.id ? t : x))
        : [t, ...prev];
      saveTrades(next);
      return next;
    });
  };

  const deleteTrade = (id: string) => {
    if (!confirm("Ștergi tranzacția? Nu se mai poate recupera.")) return;
    setTrades((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTrades(next);
      return next;
    });
  };

  const allTags = useMemo(() => {
    const s = new Set<string>();
    trades.forEach((t) => t.tags.forEach((tag) => s.add(tag)));
    return [...s].sort();
  }, [trades]);

  const filtered = useMemo(() => {
    if (!tagFilter) return trades;
    return trades.filter((t) => t.tags.includes(tagFilter));
  }, [trades, tagFilter]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);

  const editing = editId ? trades.find((t) => t.id === editId) : null;

  return (
    <div className="space-y-6">
      <CalculatorPanel onSaveAsDraft={openDraftFromCalc} />

      <StatsPanel stats={stats} totalTrades={filtered.length} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setDraftFromCalc(null);
              setShowAdd(true);
            }}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-emerald-400"
          >
            + Trade nou
          </button>
          {allTags.length > 0 ? (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200"
            >
              <option value="">Toate tag-urile</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag} className="bg-crypto-dark">
                  #{tag}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportJson(trades)}
            disabled={trades.length === 0}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-300 transition hover:border-emerald-400/30 hover:text-emerald-300 disabled:opacity-40"
          >
            ↓ Export JSON
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm("Ștergi TOATE tranzacțiile? Nu se mai poate recupera.")) return;
              setTrades([]);
              saveTrades([]);
            }}
            disabled={trades.length === 0}
            className="rounded-lg border border-rose-400/20 bg-rose-400/5 px-3 py-2 text-xs text-rose-300 transition hover:border-rose-400/40 disabled:opacity-40"
          >
            ✕ Șterge tot
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <TradeTable
          trades={filtered}
          onEdit={(id) => {
            setEditId(id);
            setShowAdd(true);
          }}
          onDelete={deleteTrade}
        />
        <CalendarPnl trades={filtered} />
      </div>

      <p className="pt-4 text-center text-xs text-slate-600">
        Datele sunt stocate doar pe device-ul tău (localStorage). Fă export JSON regulat ca
        backup. Versiunea cu sincronizare cloud e pe roadmap.
      </p>

      {showAdd ? (
        <TradeModal
          existing={editing ?? undefined}
          draft={!editing ? draftFromCalc : null}
          onClose={() => {
            setShowAdd(false);
            setEditId(null);
            setDraftFromCalc(null);
          }}
          onSave={(t) => {
            upsertTrade(t);
            setShowAdd(false);
            setEditId(null);
            setDraftFromCalc(null);
          }}
        />
      ) : null}
    </div>
  );
}

type Stats = {
  closedCount: number;
  openCount: number;
  totalPnl: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  avgR: number;
  bestTrade: number;
  worstTrade: number;
};

function computeStats(trades: Trade[]): Stats {
  const closed = trades.filter((t) => t.status !== "open" && t.pnl != null);
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.pnl ?? 0) < 0);
  const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
  const avgWin =
    wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss =
    losses.length > 0 ? losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length : 0;
  const grossProfit = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const expectancy = closed.length > 0 ? totalPnl / closed.length : 0;
  const rMultiples = closed
    .map((t) => computeR(t))
    .filter((r): r is number => r != null && Number.isFinite(r));
  const avgR =
    rMultiples.length > 0 ? rMultiples.reduce((s, r) => s + r, 0) / rMultiples.length : 0;
  const pnls = closed.map((t) => t.pnl ?? 0);
  const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
  const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;
  return {
    closedCount: closed.length,
    openCount: trades.length - closed.length,
    totalPnl,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    avgR,
    bestTrade,
    worstTrade,
  };
}

function StatsPanel({ stats, totalTrades }: { stats: Stats; totalTrades: number }) {
  const pnlTone = stats.totalPnl > 0 ? "pos" : stats.totalPnl < 0 ? "neg" : "neutral";
  const pfTone =
    stats.profitFactor === Infinity
      ? "pos"
      : stats.profitFactor >= 2
        ? "pos"
        : stats.profitFactor >= 1
          ? "neutral"
          : "neg";
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="P&L total"
          value={fmtUsd(stats.totalPnl)}
          hint={`${stats.closedCount} închise · ${stats.openCount} deschise`}
          tone={pnlTone}
        />
        <Stat label="Win rate" value={fmtPct(stats.winRate, false)} tone="neutral" />
        <Stat
          label="Profit factor"
          value={
            stats.profitFactor === Infinity
              ? "∞"
              : stats.profitFactor.toFixed(2)
          }
          hint="≥2 = solid, ≥1 = breakeven+"
          tone={pfTone}
        />
        <Stat
          label="Expectancy / trade"
          value={fmtUsd(stats.expectancy)}
          hint={`${stats.avgR.toFixed(2)}R mediu`}
          tone={stats.expectancy > 0 ? "pos" : stats.expectancy < 0 ? "neg" : "neutral"}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Mini label="Câștig mediu" value={fmtUsd(stats.avgWin)} tone="pos" />
        <Mini label="Pierdere medie" value={fmtUsd(stats.avgLoss)} tone="neg" />
        <Mini label="Cel mai bun trade" value={fmtUsd(stats.bestTrade)} tone="pos" />
        <Mini label="Cel mai prost trade" value={fmtUsd(stats.worstTrade)} tone="neg" />
      </div>
      {totalTrades === 0 ? (
        <p className="text-center text-xs text-slate-500">
          Niciun trade salvat încă. Adaugă primul ca să vezi statistici reale.
        </p>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: "pos" | "neg" | "neutral";
}) {
  const color =
    tone === "pos" ? "text-emerald-400" : tone === "neg" ? "text-rose-400" : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-data text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "pos" | "neg" | "neutral";
}) {
  const color =
    tone === "pos" ? "text-emerald-300" : tone === "neg" ? "text-rose-300" : "text-slate-200";
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 font-data text-base font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function TradeTable({
  trades,
  onEdit,
  onDelete,
}: {
  trades: Trade[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (trades.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-slate-500">
        Niciun trade. Salvează primul folosind butonul de sus sau din Calculator.
      </div>
    );
  }
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <h2 className="text-sm font-bold text-white">Tranzacții</h2>
        <p className="text-[11px] text-slate-500">{trades.length} tradeuri</p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-5 py-2">Data</th>
              <th className="py-2">Symbol</th>
              <th className="py-2">Dir</th>
              <th className="py-2 text-right">Entry</th>
              <th className="py-2 text-right">Exit</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">P&L</th>
              <th className="py-2 text-right">R</th>
              <th className="px-5 py-2 text-right" />
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => {
              const r = computeR(t);
              const pnlColor =
                t.pnl == null
                  ? "text-slate-500"
                  : t.pnl > 0
                    ? "text-emerald-400"
                    : t.pnl < 0
                      ? "text-rose-400"
                      : "text-slate-300";
              const rColor =
                r == null
                  ? "text-slate-500"
                  : r > 0
                    ? "text-emerald-300"
                    : r < 0
                      ? "text-rose-300"
                      : "text-slate-300";
              return (
                <tr key={t.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-slate-400">{t.date}</td>
                  <td className="py-3 font-bold text-white">{t.symbol}</td>
                  <td className="py-3">
                    <span
                      className={
                        t.direction === "long"
                          ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300"
                          : "rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300"
                      }
                    >
                      {t.direction === "long" ? "L" : "S"}
                    </span>
                  </td>
                  <td className="py-3 text-right font-data tabular-nums text-slate-300">
                    {t.entry.toLocaleString("en-US")}
                  </td>
                  <td className="py-3 text-right font-data tabular-nums text-slate-300">
                    {t.exit != null ? t.exit.toLocaleString("en-US") : "—"}
                  </td>
                  <td className="py-3 text-right font-data tabular-nums text-slate-400">
                    {t.qty.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                  </td>
                  <td className={`py-3 text-right font-data tabular-nums ${pnlColor}`}>
                    {fmtUsd(t.pnl)}
                  </td>
                  <td className={`py-3 text-right font-data tabular-nums ${rColor}`}>
                    {r != null ? `${r >= 0 ? "+" : ""}${r.toFixed(2)}R` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(t.id)}
                        title="Editează"
                        className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:border-emerald-400/30 hover:text-emerald-300"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(t.id)}
                        title="Șterge"
                        className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:border-rose-400/30 hover:text-rose-300"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CalendarPnl({ trades }: { trades: Trade[] }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const { year, month, label, daysInMonth, firstDayOfWeek, byDay } = useMemo(() => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const y = target.getFullYear();
    const m = target.getMonth();
    const lab = target.toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
    const dim = new Date(y, m + 1, 0).getDate();
    const fdow = (new Date(y, m, 1).getDay() + 6) % 7; // Mon=0
    const map: Record<number, number> = {};
    trades.forEach((t) => {
      if (t.pnl == null) return;
      const td = new Date(`${t.date}T12:00:00Z`);
      if (td.getFullYear() === y && td.getMonth() === m) {
        const d = td.getDate();
        map[d] = (map[d] ?? 0) + (t.pnl ?? 0);
      }
    });
    return {
      year: y,
      month: m,
      label: lab,
      daysInMonth: dim,
      firstDayOfWeek: fdow,
      byDay: map,
    };
  }, [trades, monthOffset]);

  const monthTotal = Object.values(byDay).reduce((s, v) => s + v, 0);
  const tradingDays = Object.keys(byDay).length;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-white">Calendar P&L</h2>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonthOffset((x) => x - 1)}
            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setMonthOffset(0)}
            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
          >
            azi
          </button>
          <button
            type="button"
            onClick={() => setMonthOffset((x) => x + 1)}
            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
          >
            ›
          </button>
        </div>
      </header>
      <div className="p-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const pnl = byDay[day];
            const isToday =
              year === new Date().getFullYear() &&
              month === new Date().getMonth() &&
              day === new Date().getDate();
            const tone =
              pnl == null
                ? "border-white/5 bg-white/[0.01] text-slate-600"
                : pnl > 0
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : pnl < 0
                    ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
                    : "border-white/10 bg-white/[0.04] text-slate-300";
            return (
              <div
                key={day}
                className={`flex aspect-square flex-col items-center justify-center rounded-md border text-xs ${tone} ${
                  isToday ? "ring-1 ring-emerald-400/50" : ""
                }`}
                title={pnl != null ? fmtUsd(pnl) : undefined}
              >
                <span className="text-[10px] opacity-70">{day}</span>
                {pnl != null ? (
                  <span className="mt-0.5 text-[9px] font-data tabular-nums">
                    {pnl > 0 ? "+" : ""}
                    {Math.abs(pnl) >= 1000
                      ? `${(pnl / 1000).toFixed(1)}k`
                      : pnl.toFixed(0)}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
          <span className="text-slate-500">{tradingDays} zile cu trade-uri</span>
          <span
            className={`font-data tabular-nums ${
              monthTotal > 0
                ? "text-emerald-400"
                : monthTotal < 0
                  ? "text-rose-400"
                  : "text-slate-300"
            }`}
          >
            {fmtUsd(monthTotal)}
          </span>
        </div>
      </div>
    </section>
  );
}

function TradeModal({
  existing,
  draft,
  onClose,
  onSave,
}: {
  existing?: Trade;
  draft?: CalculatorDraft | null;
  onClose: () => void;
  onSave: (t: Trade) => void;
}) {
  const seed: Trade =
    existing ??
    (draft
      ? {
          id: uid(),
          symbol: draft.symbol,
          direction: draft.direction,
          entry: draft.entry,
          exit: null,
          stop: draft.stop,
          qty: draft.qty,
          riskAmount: draft.riskAmount,
          leverage: draft.leverage ?? 1,
          date: todayIso(),
          notes: "",
          tags: [],
          status: "open",
          pnl: null,
          rMultiple: null,
          createdAt: new Date().toISOString(),
        }
      : {
          id: uid(),
          symbol: "",
          direction: "long",
          entry: 0,
          exit: null,
          stop: null,
          qty: 0,
          riskAmount: null,
          leverage: 1,
          date: todayIso(),
          notes: "",
          tags: [],
          status: "open",
          pnl: null,
          rMultiple: null,
          createdAt: new Date().toISOString(),
        });

  const [t, setT] = useState<Trade>(seed);
  const [tagInput, setTagInput] = useState("");

  const update = <K extends keyof Trade>(key: K, value: Trade[K]) => {
    setT((prev) => ({ ...prev, [key]: value }));
  };

  const computedPnl = useMemo(
    () =>
      computePnl({
        direction: t.direction,
        entry: t.entry,
        exit: t.exit,
        qty: t.qty,
      }),
    [t.direction, t.entry, t.exit, t.qty],
  );

  const handleSave = () => {
    if (!t.symbol.trim()) {
      alert("Symbol obligatoriu (ex: BTCUSDT)");
      return;
    }
    if (!Number.isFinite(t.entry) || t.entry <= 0) {
      alert("Entry price invalid");
      return;
    }
    const pnl = t.exit != null ? computedPnl : null;
    let status: Trade["status"] = "open";
    if (t.exit != null) {
      if (pnl == null) status = "open";
      else if (pnl > 0) status = "win";
      else if (pnl < 0) status = "loss";
      else status = "breakeven";
    }
    const r =
      pnl != null && t.riskAmount != null && t.riskAmount > 0
        ? pnl / t.riskAmount
        : null;
    onSave({ ...t, pnl, status, rMultiple: r });
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!tag) return;
    if (t.tags.includes(tag)) {
      setTagInput("");
      return;
    }
    update("tags", [...t.tags, tag]);
    setTagInput("");
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto p-4 sm:items-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0D1117] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-bold text-white">
            {existing ? "Editează trade" : "Trade nou"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Închide"
          >
            ✕
          </button>
        </header>

        <div className="space-y-4 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Symbol">
              <input
                value={t.symbol}
                onChange={(e) => update("symbol", e.target.value.toUpperCase())}
                placeholder="BTCUSDT"
                className={inputCls}
              />
            </Field>
            <Field label="Data">
              <input
                type="date"
                value={t.date}
                onChange={(e) => update("date", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Direcție">
              <div className="grid grid-cols-2 gap-2">
                {(["long", "short"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => update("direction", d)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      t.direction === d
                        ? d === "long"
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                          : "border-rose-400/40 bg-rose-400/10 text-rose-300"
                        : "border-white/10 bg-white/[0.02] text-slate-400"
                    }`}
                  >
                    {d === "long" ? "Long" : "Short"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Levier">
              <input
                inputMode="decimal"
                value={String(t.leverage)}
                onChange={(e) => update("leverage", Math.max(1, Number(e.target.value) || 1))}
                className={inputCls}
              />
            </Field>
            <Field label="Entry">
              <input
                inputMode="decimal"
                value={t.entry || ""}
                onChange={(e) => update("entry", Number(e.target.value.replace(",", ".")) || 0)}
                className={inputCls}
              />
            </Field>
            <Field label="Stop-loss">
              <input
                inputMode="decimal"
                value={t.stop ?? ""}
                onChange={(e) =>
                  update("stop", e.target.value ? Number(e.target.value.replace(",", ".")) : null)
                }
                className={inputCls}
              />
            </Field>
            <Field label="Cantitate">
              <input
                inputMode="decimal"
                value={t.qty || ""}
                onChange={(e) => update("qty", Number(e.target.value.replace(",", ".")) || 0)}
                className={inputCls}
              />
            </Field>
            <Field label="Sumă riscată ($)">
              <input
                inputMode="decimal"
                value={t.riskAmount ?? ""}
                onChange={(e) =>
                  update(
                    "riskAmount",
                    e.target.value ? Number(e.target.value.replace(",", ".")) : null,
                  )
                }
                className={inputCls}
              />
            </Field>
            <Field label="Exit (gol = încă deschis)">
              <input
                inputMode="decimal"
                value={t.exit ?? ""}
                onChange={(e) =>
                  update(
                    "exit",
                    e.target.value ? Number(e.target.value.replace(",", ".")) : null,
                  )
                }
                className={inputCls}
              />
            </Field>
            <div className="flex items-end">
              {computedPnl != null ? (
                <div
                  className={`w-full rounded-xl border p-3 text-sm font-bold ${
                    computedPnl > 0
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : computedPnl < 0
                        ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
                        : "border-white/10 bg-white/[0.02] text-slate-300"
                  }`}
                >
                  P&L: {fmtUsd(computedPnl)}
                  {t.riskAmount && t.riskAmount > 0 ? (
                    <span className="ml-2 text-xs opacity-80">
                      ({(computedPnl / t.riskAmount).toFixed(2)}R)
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-500">
                  Adaugă exit pentru P&L
                </div>
              )}
            </div>
          </div>

          <Field label="Tag-uri (ex: scalp, swing, btc, ftm)">
            <div className="flex flex-wrap gap-2">
              {t.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => update("tags", t.tags.filter((x) => x !== tag))}
                  className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-xs text-emerald-300 hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-300"
                >
                  #{tag} ✕
                </button>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="+ tag"
                className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-0.5 text-xs text-slate-300 placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none"
              />
            </div>
          </Field>

          <Field label="Note (de ce ai intrat? ce ai învățat?)">
            <textarea
              value={t.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className={`${inputCls} resize-y`}
              placeholder="Setup A+ pe daily, RSI oversold..."
            />
          </Field>

          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.04]"
            >
              Anulează
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-black hover:bg-emerald-400"
            >
              {existing ? "Salvează modificările" : "Salvează trade"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 font-data text-sm text-white tabular-nums placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/30";
