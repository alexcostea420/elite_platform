"use client";

import { fmtPct, fmtQty, fmtUsd, type Holding } from "./portfolio-dashboard";

const TYPE_BADGE: Record<Holding["asset"]["type"], { label: string; cls: string }> = {
  crypto: { label: "Crypto", cls: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
  stock: { label: "Stock", cls: "border-blue-400/30 bg-blue-400/10 text-blue-300" },
  index: { label: "Index", cls: "border-purple-400/30 bg-purple-400/10 text-purple-300" },
};

export function HoldingsTable({
  holdings,
  loading,
  onWhatIf,
}: {
  holdings: Holding[];
  loading: boolean;
  onWhatIf: (h: Holding) => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <h2 className="text-sm font-bold text-white">Pozițiile tale</h2>
        <p className="text-[11px] text-slate-500">
          {loading ? "Se încarcă prețurile…" : "Prețuri actualizate"}
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-5 py-2">Asset</th>
              <th className="py-2 text-right">Cantitate</th>
              <th className="py-2 text-right">Cost mediu</th>
              <th className="py-2 text-right">Preț curent</th>
              <th className="py-2 text-right">Valoare</th>
              <th className="py-2 text-right">P&amp;L</th>
              <th className="px-5 py-2 text-right" />
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const typeBadge = TYPE_BADGE[h.asset.type];
              const pnlColor =
                h.pnlPct == null
                  ? "text-slate-600"
                  : h.pnlPct > 0
                    ? "text-emerald-400"
                    : h.pnlPct < 0
                      ? "text-rose-400"
                      : "text-slate-300";
              return (
                <tr key={h.asset.key} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{h.asset.symbol}</span>
                      <span
                        className={`rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase ${typeBadge.cls}`}
                      >
                        {typeBadge.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{h.asset.name}</p>
                  </td>
                  <td className="py-3 text-right font-data tabular-nums text-slate-300">
                    {fmtQty(h.qty)}
                  </td>
                  <td className="py-3 text-right font-data tabular-nums text-slate-300">
                    {fmtUsd(h.avgCostUsd)}
                  </td>
                  <td className="py-3 text-right font-data tabular-nums text-slate-300">
                    {h.currentPriceUsd != null ? fmtUsd(h.currentPriceUsd) : "-"}
                  </td>
                  <td className="py-3 text-right font-data tabular-nums text-white">
                    {h.currentValueUsd != null ? fmtUsd(h.currentValueUsd) : "-"}
                  </td>
                  <td className={`py-3 text-right font-data tabular-nums ${pnlColor}`}>
                    {h.pnlUsd != null && h.pnlPct != null ? (
                      <div className="flex flex-col items-end">
                        <span>{fmtUsd(h.pnlUsd)}</span>
                        <span className="text-[11px] opacity-80">{fmtPct(h.pnlPct)}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onWhatIf(h)}
                      title="Compară cu altă alegere"
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300"
                    >
                      What if?
                    </button>
                  </td>
                </tr>
              );
            })}
            {holdings.length === 0 && !loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">
                  Nicio poziție activă.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
