import { NextResponse } from "next/server";
import { Resend } from "resend";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";

const ALEX_EMAIL = "contact@armatadetraderi.com";

const PACKAGE_LABELS: Record<string, string> = {
  single: "1 oră (€75)",
  triple: "Pachet 3 ore (€197)",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Începător (sub 6 luni)",
  intermediate: "Intermediar (6 luni - 2 ani)",
  advanced: "Avansat (peste 2 ani)",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const { allowed } = await checkRateLimit(`coaching:${ip}`, 3, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Prea multe încercări. Așteaptă un minut." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const pkg = String(body.package ?? "").trim();
    const topic = String(body.topic ?? "").trim();
    const experience = String(body.experience ?? "").trim();
    const details = String(body.details ?? "").trim();
    const preferredTime = String(body.preferred_time ?? "").trim();

    if (!name || name.length > 100) {
      return NextResponse.json({ error: "Nume invalid" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Email invalid" }, { status: 400 });
    }
    if (!PACKAGE_LABELS[pkg]) {
      return NextResponse.json({ error: "Pachet invalid" }, { status: 400 });
    }
    if (!topic || topic.length > 200) {
      return NextResponse.json({ error: "Temă invalidă" }, { status: 400 });
    }
    if (!EXPERIENCE_LABELS[experience]) {
      return NextResponse.json({ error: "Nivel invalid" }, { status: 400 });
    }
    if (details.length > 1000) {
      return NextResponse.json({ error: "Detalii prea lungi" }, { status: 400 });
    }
    if (preferredTime.length > 200) {
      return NextResponse.json({ error: "Disponibilitate prea lungă" }, { status: 400 });
    }

    const supabase = createServiceRoleSupabaseClient();

    const metadata = {
      name,
      package: pkg,
      package_label: PACKAGE_LABELS[pkg],
      topic,
      experience,
      experience_label: EXPERIENCE_LABELS[experience],
      details: details || null,
      preferred_time: preferredTime || null,
      submitted_at: new Date().toISOString(),
    };

    const { error: dbError } = await supabase.from("leads").upsert(
      {
        email,
        source: "coaching_session",
        metadata,
        created_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

    if (dbError) {
      console.error("Coaching lead save error:", dbError);
    }

    // Notify Alex via email
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const html = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0D1F18;color:#FFFFFF;border-radius:12px;">
            <h2 style="color:#0B6623;margin:0 0 20px;">Cerere nouă pentru sesiune 1-la-1</h2>
            <table cellpadding="6" cellspacing="0" style="width:100%;font-size:14px;color:#A3B8B0;border-collapse:collapse;">
              <tr><td style="font-weight:600;color:#FFF;width:140px;">Nume</td><td>${escapeHtml(name)}</td></tr>
              <tr><td style="font-weight:600;color:#FFF;">Email</td><td><a href="mailto:${escapeHtml(email)}" style="color:#0B6623;">${escapeHtml(email)}</a></td></tr>
              <tr><td style="font-weight:600;color:#FFF;">Pachet</td><td>${escapeHtml(PACKAGE_LABELS[pkg])}</td></tr>
              <tr><td style="font-weight:600;color:#FFF;">Experiență</td><td>${escapeHtml(EXPERIENCE_LABELS[experience])}</td></tr>
              <tr><td style="font-weight:600;color:#FFF;">Temă</td><td>${escapeHtml(topic)}</td></tr>
              ${preferredTime ? `<tr><td style="font-weight:600;color:#FFF;vertical-align:top;">Disponibilitate</td><td>${escapeHtml(preferredTime)}</td></tr>` : ""}
              ${details ? `<tr><td style="font-weight:600;color:#FFF;vertical-align:top;">Detalii</td><td style="white-space:pre-wrap;">${escapeHtml(details)}</td></tr>` : ""}
            </table>
            <p style="margin-top:24px;font-size:12px;color:#5A7168;">Răspunde direct la acest email — replyul ajunge la solicitant.</p>
          </div>
        `;

        await resend.emails.send({
          from: "Armata de Traderi <noreply@armatadetraderi.com>",
          to: ALEX_EMAIL,
          replyTo: email,
          subject: `Sesiune 1-la-1: ${name} — ${PACKAGE_LABELS[pkg]}`,
          html,
        });
      } catch (emailError) {
        console.error("Coaching email send error:", emailError);
      }
    }

    // Notify Alex via Discord webhook (optional — gated on env var)
    const discordWebhook = process.env.DISCORD_NOTIFY_WEBHOOK;
    if (discordWebhook) {
      try {
        const lines = [
          "🎓 **Cerere nouă: Sesiune 1-la-1**",
          "",
          `**Nume:** ${name}`,
          `**Email:** ${email}`,
          `**Pachet:** ${PACKAGE_LABELS[pkg]}`,
          `**Experiență:** ${EXPERIENCE_LABELS[experience]}`,
          `**Temă:** ${topic}`,
        ];
        if (preferredTime) lines.push(`**Disponibilitate:** ${preferredTime}`);
        if (details) {
          const truncated = details.length > 500 ? `${details.slice(0, 500)}…` : details;
          lines.push(`**Detalii:**\n>>> ${truncated.replace(/\n/g, "\n>>> ")}`);
        }
        lines.push("", "_Răspunde la email cu reply direct — ajunge la solicitant._");

        await fetch(discordWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: lines.join("\n"),
            allowed_mentions: { parse: [] },
          }),
        });
      } catch (discordError) {
        console.error("Coaching Discord webhook error:", discordError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Coaching API error:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
