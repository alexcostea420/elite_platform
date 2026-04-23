export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function fmtP(v: number | null | undefined): string {
  if (v == null) return "—";
  if (v >= 1000)
    return "$" + (v / 1000).toFixed(v >= 10000 ? 0 : 1) + "K";
  return "$" + Math.round(v);
}

export function fmtDate(d: Date): string {
  const dd = d.getDate();
  const mm = d.getMonth() + 1;
  const yy = d.getFullYear();
  return (dd < 10 ? "0" : "") + dd + "." + (mm < 10 ? "0" : "") + mm + "." + yy;
}

export function diffDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}
