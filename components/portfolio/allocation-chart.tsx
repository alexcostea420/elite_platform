"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { fmtPct, fmtUsd, type Holding } from "./portfolio-dashboard";

const COLORS = [
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#A855F7",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
  "#F97316",
  "#6366F1",
];

export function AllocationChart({ holdings }: { holdings: Holding[] }) {
  const data = holdings
    .filter((h) => h.currentValueUsd != null && h.currentValueUsd > 0)
    .map((h) => ({
      name: h.asset.symbol,
      fullName: h.asset.name,
      value: h.currentValueUsd ?? 0,
      pct: h.allocationPct ?? 0,
    }));

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="mb-2 text-sm font-bold text-white">Alocare</h2>
      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
          Nu sunt prețuri disponibile încă.
        </p>
      ) : (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0D1117",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value, _name, item) => {
                    const v = typeof value === "number" ? value : Number(value);
                    return [
                      `${fmtUsd(v)} · ${fmtPct((v / total) * 100, false)}`,
                      (item?.payload as { fullName?: string } | undefined)?.fullName ?? "",
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5">
            {data.slice(0, 6).map((d, i) => (
              <li
                key={d.name}
                className="flex items-center justify-between text-[11px]"
              >
                <span className="flex items-center gap-2 text-slate-300">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="font-semibold">{d.name}</span>
                </span>
                <span className="font-data tabular-nums text-slate-400">
                  {fmtPct(d.pct, false)}
                </span>
              </li>
            ))}
            {data.length > 6 ? (
              <li className="pl-4 text-[11px] text-slate-600">
                + {data.length - 6} altele
              </li>
            ) : null}
          </ul>
        </>
      )}
    </section>
  );
}
