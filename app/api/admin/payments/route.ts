import { NextRequest, NextResponse } from "next/server";

import { getAllPayments, getSubscriptionMetrics } from "@/lib/payments/server";
import type { PaymentStatus } from "@/lib/payments/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
    }

    const format = request.nextUrl.searchParams.get("format");
    const statusFilter = request.nextUrl.searchParams.get("status") as PaymentStatus | null;
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 50, 100);
    const offset = Number(request.nextUrl.searchParams.get("offset")) || 0;

    // CSV export
    if (format === "csv") {
      const { payments: allPayments } = await getAllPayments({
        status: statusFilter ?? undefined,
        limit: 10000,
        offset: 0,
      });

      const csvHeader = "date,user,plan,amount_expected,amount_received,chain,tx_hash,status,confirmed_at";
      const csvRows = allPayments.map((p) => {
        const row = p as Record<string, unknown>;
        const profiles = row.profiles as Record<string, string> | null;
        let userName = profiles?.full_name ?? profiles?.discord_username ?? "";
        // Prevent CSV formula injection
        if (/^[=+\-@\t\r]/.test(userName)) userName = `'${userName}`;
        return [
          row.created_at,
          `"${userName.replace(/"/g, '""')}"`,
          row.plan_duration,
          row.amount_expected,
          row.amount_received ?? "",
          row.chain,
          row.tx_hash ?? "",
          row.status,
          row.confirmed_at ?? "",
        ].join(",");
      });

      const csv = [csvHeader, ...csvRows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="payments-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    const [{ payments, total }, metrics] = await Promise.all([
      getAllPayments({
        status: statusFilter ?? undefined,
        limit,
        offset,
      }),
      getSubscriptionMetrics(),
    ]);

    return NextResponse.json({
      payments,
      total,
      metrics,
    });
  } catch {
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 });
  }
}
