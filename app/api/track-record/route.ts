import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import Database from "better-sqlite3";

export const revalidate = 300; // Cache 5 minutes

const TRADES_DB = "/Users/server/trading-bot/data/trades.db";
const LIMITS_FILE = "/Users/server/trading-bot/data/dynamic_limits.json";
const STARTING_EQUITY = 1000; // Anonymized starting capital

export async function GET() {
  try {
    // Read dynamic limits
    let equity = 0;
    try {
      const limits = JSON.parse(readFileSync(LIMITS_FILE, "utf-8"));
      equity = limits.equity ?? 0;
    } catch {
      equity = 0;
    }

    // Read trades from SQLite
    const db = new Database(TRADES_DB, { readonly: true });

    const trades = db
      .prepare(
        `SELECT bot_name, timestamp, side, entry_price, exit_price, pnl, status, reason
         FROM trades WHERE status = 'closed' AND pnl IS NOT NULL
         ORDER BY timestamp DESC`
      )
      .all() as {
      bot_name: string;
      timestamp: string;
      side: string;
      entry_price: number;
      exit_price: number;
      pnl: number;
      status: string;
      reason: string;
    }[];

    db.close();

    // Calculate stats
    const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
    const wins = trades.filter((t) => t.pnl > 0);
    const losses = trades.filter((t) => t.pnl <= 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;
    const bestTrade = trades.length > 0 ? Math.max(...trades.map((t) => t.pnl)) : 0;
    const worstTrade = trades.length > 0 ? Math.min(...trades.map((t) => t.pnl)) : 0;

    // Equity curve (cumulative PnL over time)
    const sortedTrades = [...trades].reverse(); // oldest first
    let cumPnl = 0;
    const equityCurve = sortedTrades.map((t) => {
      cumPnl += t.pnl;
      return {
        date: t.timestamp.slice(0, 10),
        equity: STARTING_EQUITY + cumPnl,
        pnl: cumPnl,
      };
    });

    // Max drawdown
    let peak = STARTING_EQUITY;
    let maxDD = 0;
    for (const point of equityCurve) {
      if (point.equity > peak) peak = point.equity;
      const dd = ((peak - point.equity) / peak) * 100;
      if (dd > maxDD) maxDD = dd;
    }

    // Recent trades (last 10, anonymized)
    const recentTrades = trades.slice(0, 10).map((t) => {
      const asset = t.bot_name
        .replace("portfolio_", "")
        .replace(/_ml_\d+[hm]/i, "")
        .toUpperCase();
      const pnlPct =
        t.entry_price > 0
          ? ((t.exit_price - t.entry_price) / t.entry_price) * 100 * (t.side === "short" ? -1 : 1)
          : 0;
      return {
        date: t.timestamp.slice(0, 10),
        asset,
        direction: t.side.toUpperCase(),
        entry: t.entry_price,
        exit: t.exit_price,
        pnlPct: Math.round(pnlPct * 100) / 100,
        pnlUsd: Math.round(t.pnl * 100) / 100,
        type: t.reason || "SL/TP",
      };
    });

    // Assets traded
    const assetsTraded = new Set(
      trades.map((t) =>
        t.bot_name.replace("portfolio_", "").replace(/_ml_\d+[hm]/i, "").toUpperCase()
      )
    );

    return NextResponse.json({
      stats: {
        starting_equity: STARTING_EQUITY,
        current_equity: Math.round((STARTING_EQUITY + totalPnl) * 100) / 100,
        total_pnl: Math.round(totalPnl * 100) / 100,
        total_pnl_pct: Math.round((totalPnl / STARTING_EQUITY) * 10000) / 100,
        total_trades: trades.length,
        win_rate: Math.round(winRate * 10) / 10,
        profit_factor: Math.round(profitFactor * 100) / 100,
        max_drawdown: Math.round(maxDD * 10) / 10,
        best_trade: Math.round(bestTrade * 100) / 100,
        worst_trade: Math.round(worstTrade * 100) / 100,
        avg_win: Math.round(avgWin * 100) / 100,
        avg_loss: Math.round(avgLoss * 100) / 100,
        assets_traded: assetsTraded.size,
      },
      equity_curve: equityCurve,
      recent_trades: recentTrades,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Track record API error:", error);
    return NextResponse.json({ stats: null, error: "Date indisponibile" });
  }
}
