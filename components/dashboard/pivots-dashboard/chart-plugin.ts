import type { Plugin } from "chart.js";

export const eventLinePlugin: Plugin = {
  id: "eventLine",
  afterDraw(chart) {
    const idx = (chart.config as unknown as { _eventIdx?: number })._eventIdx;
    if (idx == null) return;
    const meta = chart.getDatasetMeta(0);
    const pt = meta.data[idx];
    if (!pt) return;
    const ctx = chart.ctx;
    const { top: y0, bottom: y1 } = chart.chartArea;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.lineWidth = 1;
    ctx.moveTo(pt.x, y0);
    ctx.lineTo(pt.x, y1);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.45)";
    ctx.font = "500 9px JetBrains Mono";
    ctx.textAlign = "center";
    ctx.fillText("EVENT", pt.x, y0 + 10);
    ctx.restore();
  },
};
