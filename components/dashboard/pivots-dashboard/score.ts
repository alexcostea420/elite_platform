import {
  DOM_HIGHS,
  DOM_LOWS,
  ECLIPSES_LUNAR,
  ECLIPSES_SOLAR,
  FIB_LEVELS_SCORE,
  KNOWN_FULL_MOON,
} from "@/lib/data/pivots-data";

export interface ActiveMethod {
  name: string;
  pts: number;
  type: "PRIMAR" | "secundar";
  detail?: string;
}

export interface UpcomingEvent {
  name: string;
  days: number;
}

export function calcScore() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const active: ActiveMethod[] = [];
  const upcoming: UpcomingEvent[] = [];

  ECLIPSES_SOLAR.forEach((d) => {
    const diff = (d.getTime() - today.getTime()) / 86400000;
    if (diff >= 0 && diff <= 7)
      active.push({ name: "Eclipsă Solară", pts: 3, type: "PRIMAR", detail: `în ${Math.round(diff)} zile` });
    else if (diff > 7 && diff < 120)
      upcoming.push({ name: "Eclipsă Solară Totală", days: Math.round(diff) });
  });

  ECLIPSES_LUNAR.forEach((d) => {
    const diff = (d.getTime() - today.getTime()) / 86400000;
    const adiff = Math.abs(diff);
    if (adiff <= 3)
      active.push({ name: "Eclipsă Lunară", pts: 2, type: "PRIMAR", detail: `±${Math.round(adiff)}z` });
    else if (diff > 3 && diff < 120)
      upcoming.push({ name: "Eclipsă Lunară", days: Math.round(diff) });
  });

  FIB_LEVELS_SCORE.forEach((f) => {
    const diff = (f.d.getTime() - today.getTime()) / 86400000;
    const adiff = Math.abs(diff);
    if (adiff <= 7)
      active.push({ name: `Fibonacci ${f.name}`, pts: 2, type: "PRIMAR", detail: `±${Math.round(adiff)}z` });
    else if (diff > 7 && diff < 200)
      upcoming.push({ name: `Fibonacci ${f.name}`, days: Math.round(diff) });
  });

  const m = today.getMonth() + 1;
  const day = today.getDate();
  if ((m === 1 && day >= 16) || (m === 2 && day <= 15))
    active.push({ name: "Sezonier Ianuarie", pts: 1, type: "secundar" });

  const dom = today.getDate();
  const hv = DOM_HIGHS[dom] || 0;
  const lv = DOM_LOWS[dom] || 0;
  if (hv >= 1.3 || lv >= 1.3) {
    const favors =
      hv >= lv
        ? `top-uri +${Math.round((hv - 1) * 100)}%`
        : `low-uri +${Math.round((lv - 1) * 100)}%`;
    active.push({ name: `Zi din Lună (${dom})`, pts: 1, type: "secundar", detail: favors });
  }

  const daysF = (today.getTime() - KNOWN_FULL_MOON.getTime()) / 86400000;
  const cp = ((daysF % 29.53) + 29.53) % 29.53;
  const df = Math.min(cp, 29.53 - cp);
  const dn = Math.abs(cp - 14.765);
  if (df <= 1.5) active.push({ name: "Lună Plină", pts: 1, type: "secundar", detail: `±${df.toFixed(1)}z` });
  else if (dn <= 1.5) active.push({ name: "Lună Nouă", pts: 1, type: "secundar", detail: `±${dn.toFixed(1)}z` });

  const total = active.reduce((sum, x) => sum + x.pts, 0);
  const hasPrimary = active.some((x) => x.type === "PRIMAR");
  return { total, active, upcoming, hasPrimary };
}
