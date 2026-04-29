import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { generateUnsubToken } from "@/lib/utils/unsubscribe";

const EMAIL_TEMPLATES: Record<string, string> = {
  welcome: `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#06110D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06110D;"><tr><td align="center" style="padding:40px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0D1F18;border-radius:16px;border:1px solid rgba(11,102,35,0.25);"><tr><td align="center" style="padding:40px 32px 16px;"><div style="font-size:28px;font-weight:800;color:#0B6623;">🪖 Armata de Traderi</div></td></tr><tr><td style="padding:0 32px 32px;"><h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">Contul tău Elite e activ</h1><p style="margin:0 0 28px;font-size:15px;line-height:1.8;color:#A3B8B0;">Ai 7 zile acces la tot. Uite cum să profiți la maxim:</p><div style="background:#0A1712;border-radius:12px;padding:16px 20px;margin:0 0 12px;"><p style="margin:0;font-size:14px;color:#FFFFFF;font-weight:600;">1. Conectează-ți Discord-ul</p><p style="margin:4px 0 0;font-size:13px;color:#A3B8B0;">Primești instant acces la canalele Elite unde discutăm în timp real ce se întâmplă pe piață.</p></div><div style="background:#0A1712;border-radius:12px;padding:16px 20px;margin:0 0 12px;"><p style="margin:0;font-size:14px;color:#FFFFFF;font-weight:600;">2. Uită-te la ultimele 3 video-uri</p><p style="margin:4px 0 0;font-size:13px;color:#A3B8B0;">Sunt cele mai recente analize. Îți dau o idee clară despre cum gândesc și cum iau decizii.</p></div><div style="background:#0A1712;border-radius:12px;padding:16px 20px;margin:0 0 24px;"><p style="margin:0;font-size:14px;color:#FFFFFF;font-weight:600;">3. Verifică portofoliul de stocks</p><p style="margin:4px 0 0;font-size:13px;color:#A3B8B0;">16 acțiuni cu zone exacte de Buy și Sell. Vezi unde suntem poziționați și de ce.</p></div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="https://app.armatadetraderi.com/dashboard" style="display:inline-block;padding:14px 40px;background-color:#0B6623;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">Intră în Dashboard</a></td></tr></table><p style="margin:20px 0 0;font-size:13px;color:#5A7168;text-align:center;">Dacă ai întrebări, scrie direct pe Discord. Răspund personal.</p></td></tr><tr><td style="padding:24px 32px;border-top:1px solid rgba(11,102,35,0.15);"><p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">Alex Costea - Armata de Traderi<br>armatadetraderi.com</p></td></tr></table></td></tr></table></body></html>`,

  value_day1: `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#06110D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06110D;"><tr><td align="center" style="padding:40px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0D1F18;border-radius:16px;border:1px solid rgba(11,102,35,0.25);"><tr><td align="center" style="padding:40px 32px 16px;"><div style="font-size:28px;font-weight:800;color:#0B6623;">🪖 Armata de Traderi</div></td></tr><tr><td style="padding:0 32px 32px;"><h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">Greșeala care costă cel mai mult</h1><p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#A3B8B0;">Știi care e diferența între un trader care face bani și unul care pierde?</p><p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#A3B8B0;">Nu e analiză tehnică. Nu e timing-ul. Nu e "alfa" pe care îl găsești pe Twitter.</p><p style="margin:0 0 28px;font-size:15px;line-height:1.8;color:#FFFFFF;font-weight:600;">E cât de mult risc pui pe un singur trade.</p><p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#A3B8B0;">Majoritatea pun 10-20% din portofoliu pe o singură idee.<br>Când merge, se simt genii.<br>Când nu merge - și la un moment dat nu va merge - pierd luni de progres într-o zi.</p><p style="margin:0 0 28px;font-size:15px;line-height:1.8;color:#A3B8B0;">În comunitatea Elite lucrăm cu regula de 1-2%.<br>Am un video în care explic exact cum calculez sizing-ul pe fiecare trade:</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="https://app.armatadetraderi.com/dashboard/videos" style="display:inline-block;padding:14px 40px;background-color:#0B6623;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">Vezi Video-urile Elite</a></td></tr></table><p style="margin:20px 0 0;font-size:13px;color:#5A7168;text-align:center;">PS: Mâine îți trimit ce spun membrii care sunt de câteva luni în comunitate.</p></td></tr><tr><td style="padding:24px 32px;border-top:1px solid rgba(11,102,35,0.15);"><p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">Alex Costea - Armata de Traderi<br>armatadetraderi.com</p></td></tr></table></td></tr></table></body></html>`,

  social_proof: `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#06110D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06110D;"><tr><td align="center" style="padding:40px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0D1F18;border-radius:16px;border:1px solid rgba(11,102,35,0.25);"><tr><td align="center" style="padding:40px 32px 16px;"><div style="font-size:28px;font-weight:800;color:#0B6623;">🪖 Armata de Traderi</div></td></tr><tr><td style="padding:0 32px 32px;"><h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">Nu trebuie să mă crezi pe cuvânt</h1><p style="margin:0 0 28px;font-size:15px;line-height:1.8;color:#A3B8B0;">Uite ce zic oamenii care sunt deja în comunitate:</p><div style="background:#0A1712;border-radius:12px;padding:20px;margin:0 0 14px;border-left:3px solid #0B6623;"><p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#A3B8B0;font-style:italic;">"De când am intrat în Elite, sunt în sfârșit pe plus. Alex este foarte metodic, calculat, și ȘTIE MULTE!"</p><p style="margin:0;font-size:13px;color:#0B6623;font-weight:600;">Daniel - membru din octombrie 2025</p></div><div style="background:#0A1712;border-radius:12px;padding:20px;margin:0 0 14px;border-left:3px solid #0B6623;"><p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#A3B8B0;font-style:italic;">"Partea de risk management mi-a schimbat complet modul de a gândi. Nu a fost genul ăla de informație aruncată peste tine, ci explicată pe bune."</p><p style="margin:0;font-size:13px;color:#0B6623;font-weight:600;">Alex Ivana - membru din martie 2026</p></div><div style="background:rgba(245,158,11,0.08);border-radius:12px;padding:20px;margin:24px 0;border:1px solid rgba(245,158,11,0.2);"><p style="margin:0;font-size:15px;line-height:1.7;color:#F59E0B;font-weight:600;text-align:center;">Trial-ul tău e activ încă câteva zile.</p><p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#A3B8B0;text-align:center;">Dacă ți-a plăcut ce ai văzut, alege un plan și rămâi în echipă.</p></div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="https://app.armatadetraderi.com/upgrade" style="display:inline-block;padding:14px 40px;background-color:#0B6623;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">Alege un Plan</a></td></tr></table></td></tr><tr><td style="padding:24px 32px;border-top:1px solid rgba(11,102,35,0.15);"><p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">Alex Costea - Armata de Traderi<br>armatadetraderi.com</p></td></tr></table></td></tr></table></body></html>`,

  trial_expiry: `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#06110D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06110D;"><tr><td align="center" style="padding:40px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0D1F18;border-radius:16px;border:1px solid rgba(11,102,35,0.25);"><tr><td align="center" style="padding:40px 32px 16px;"><div style="font-size:28px;font-weight:800;color:#0B6623;">🪖 Armata de Traderi</div></td></tr><tr><td style="padding:0 32px 32px;"><h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">Accesul Elite se închide azi</h1><p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#A3B8B0;">După expirare, contul tău rămâne activ dar pierzi accesul la:</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr><td style="padding:5px 0;font-size:14px;color:#A3B8B0;">Canalele private Discord cu analize live</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#A3B8B0;">Cele 55+ video-uri de trading</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#A3B8B0;">Indicatorii Elite pe TradingView</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#A3B8B0;">Portofoliul de stocks cu Buy/Sell zones</td></tr></table><div style="background:#0A1712;border-radius:12px;padding:20px;margin:0 0 24px;"><p style="margin:0 0 4px;font-size:13px;color:#5A7168;">Cel mai popular plan:</p><p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#FFFFFF;">3 Luni - €137</p><p style="margin:0;font-size:13px;color:#0B6623;">Indicatori deblocați instant, fără perioadă de așteptare</p></div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="https://app.armatadetraderi.com/upgrade" style="display:inline-block;padding:14px 40px;background-color:#0B6623;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">Continuă cu Elite</a></td></tr></table><p style="margin:20px 0 0;font-size:13px;color:#5A7168;text-align:center;">Dacă nu vrei să continui, nu trebuie să faci nimic. Accesul se oprește automat.</p></td></tr><tr><td style="padding:24px 32px;border-top:1px solid rgba(11,102,35,0.15);"><p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">Alex Costea - Armata de Traderi<br>armatadetraderi.com</p></td></tr></table></td></tr></table></body></html>`,

  expiry_7d: `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#06110D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06110D;"><tr><td align="center" style="padding:40px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0D1F18;border-radius:16px;border:1px solid rgba(11,102,35,0.25);"><tr><td align="center" style="padding:40px 32px 16px;"><div style="font-size:28px;font-weight:800;color:#0B6623;">🪖 Armata de Traderi</div></td></tr><tr><td style="padding:0 32px 32px;"><h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">Abonamentul tău expiră în 7 zile</h1><p style="margin:0 0 28px;font-size:15px;line-height:1.8;color:#A3B8B0;">Încă ai timp să reînnoiești și să păstrezi accesul la toate resursele Elite.</p><p style="margin:0 0 28px;font-size:15px;line-height:1.8;color:#A3B8B0;">Ce pierzi dacă nu reînnoiești:</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="padding:5px 0;font-size:14px;color:#A3B8B0;">Discord Elite cu analize live</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#A3B8B0;">55+ video-uri de trading</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#A3B8B0;">Indicatorii TradingView</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#A3B8B0;">Portofoliu stocks cu Buy/Sell zones</td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="https://app.armatadetraderi.com/upgrade" style="display:inline-block;padding:14px 40px;background-color:#0B6623;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">Reînnoiește acum</a></td></tr></table></td></tr><tr><td style="padding:24px 32px;border-top:1px solid rgba(11,102,35,0.15);"><p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">Alex Costea - Armata de Traderi</p></td></tr></table></td></tr></table></body></html>`,

  patreon_welcome: `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#06110D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06110D;"><tr><td align="center" style="padding:40px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0D1F18;border-radius:16px;border:1px solid rgba(11,102,35,0.25);"><tr><td align="center" style="padding:40px 32px 16px;"><div style="font-size:28px;font-weight:800;color:#0B6623;">🪖 Armata de Traderi</div></td></tr><tr><td style="padding:0 32px 32px;"><h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">Plata ta Patreon a fost confirmată</h1><p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#A3B8B0;">Mulțumim că te-ai alăturat comunității! Acum trebuie doar să-ți creezi contul pe platformă ca să ai acces la tot.</p><p style="margin:0 0 8px;font-size:15px;line-height:1.8;color:#FFFFFF;font-weight:600;">Ce primești:</p><div style="background:#0A1712;border-radius:12px;padding:16px 20px;margin:0 0 12px;"><p style="margin:0;font-size:14px;color:#A3B8B0;">67+ video-uri de trading cu analize detaliate</p></div><div style="background:#0A1712;border-radius:12px;padding:16px 20px;margin:0 0 12px;"><p style="margin:0;font-size:14px;color:#A3B8B0;">Acces la canalele private Discord</p></div><div style="background:#0A1712;border-radius:12px;padding:16px 20px;margin:0 0 12px;"><p style="margin:0;font-size:14px;color:#A3B8B0;">Portofoliu de stocks cu zone exacte de Buy/Sell</p></div><div style="background:#0A1712;border-radius:12px;padding:16px 20px;margin:0 0 24px;"><p style="margin:0;font-size:14px;color:#A3B8B0;">Indicatori Elite pe TradingView</p></div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="{{INVITE_URL}}" style="display:inline-block;padding:14px 40px;background-color:#0B6623;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">Creează-ți Contul →</a></td></tr></table><p style="margin:20px 0 0;font-size:13px;color:#5A7168;text-align:center;">Link-ul este valabil 7 zile. Dacă ai probleme, scrie-i lui Alex direct pe Discord.</p></td></tr><tr><td style="padding:24px 32px;border-top:1px solid rgba(11,102,35,0.15);"><p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">Alex Costea - Armata de Traderi<br>armatadetraderi.com</p></td></tr></table></td></tr></table></body></html>`,

  expiry_1d: `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#06110D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06110D;"><tr><td align="center" style="padding:40px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0D1F18;border-radius:16px;border:1px solid rgba(245,158,11,0.3);"><tr><td align="center" style="padding:40px 32px 16px;"><div style="font-size:28px;font-weight:800;color:#0B6623;">🪖 Armata de Traderi</div></td></tr><tr><td style="padding:0 32px 32px;"><h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#F59E0B;text-align:center;">Ultima zi de acces Elite</h1><p style="margin:0 0 28px;font-size:15px;line-height:1.8;color:#A3B8B0;">Abonamentul tău expiră mâine.<br>După expirare, accesul la resursele Elite se oprește automat.</p><div style="background:rgba(245,158,11,0.08);border-radius:12px;padding:20px;margin:0 0 24px;border:1px solid rgba(245,158,11,0.2);"><p style="margin:0 0 4px;font-size:13px;color:#F59E0B;font-weight:600;">Cel mai popular plan:</p><p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#FFFFFF;">3 Luni - €137</p><p style="margin:0;font-size:13px;color:#A3B8B0;">Indicatori deblocați instant + suport prioritar</p></div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="https://app.armatadetraderi.com/upgrade" style="display:inline-block;padding:14px 40px;background-color:#F59E0B;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">Reînnoiește acum</a></td></tr></table><p style="margin:20px 0 0;font-size:13px;color:#5A7168;text-align:center;">Dacă nu vrei să continui, nu trebuie să faci nimic.</p></td></tr><tr><td style="padding:24px 32px;border-top:1px solid rgba(11,102,35,0.15);"><p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">Alex Costea - Armata de Traderi</p></td></tr></table></td></tr></table></body></html>`,
};

export async function GET(request: NextRequest) {
  try {
    const secret = request.headers.get("authorization");
    if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
    }

    const resend = new Resend(resendKey);
    const supabase = createServiceRoleSupabaseClient();

    // Get pending emails that are due
    const { data: pendingEmails } = await supabase
      .from("email_drip_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(10);

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    let sent = 0;
    for (const email of pendingEmails) {
      // Check if user is unsubscribed
      if (email.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email_unsubscribed")
          .eq("id", email.user_id)
          .maybeSingle();
        if (profile?.email_unsubscribed) {
          await supabase.from("email_drip_queue").update({ status: "cancelled" }).eq("id", email.id);
          continue;
        }
      }

      let templateHtml = EMAIL_TEMPLATES[email.template];
      if (!templateHtml) {
        await supabase.from("email_drip_queue").update({ status: "skipped" }).eq("id", email.id);
        continue;
      }

      // For patreon_welcome: look up the invite link for this email
      if (email.template === "patreon_welcome") {
        const { data: inviteRows } = await supabase
          .from("invite_links")
          .select("token")
          .ilike("notes", `%${email.email}%`)
          .eq("used_count", 0)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1);

        const inviteToken = inviteRows?.[0]?.token;
        const inviteUrl = inviteToken
          ? `https://app.armatadetraderi.com/invite/${inviteToken}`
          : "https://app.armatadetraderi.com/signup";
        templateHtml = templateHtml.replace("{{INVITE_URL}}", inviteUrl);
      }

      // Add unsubscribe footer
      const unsubToken = generateUnsubToken(email.email);
      const unsubUrl = `https://app.armatadetraderi.com/api/unsubscribe?email=${encodeURIComponent(email.email)}&token=${unsubToken}`;
      const unsubFooter = `<tr><td style="padding:16px 32px;text-align:center;"><a href="${unsubUrl}" style="font-size:11px;color:#5A7168;text-decoration:underline;">Dezabonează-te de la emailuri</a></td></tr>`;
      const html = templateHtml.replace("</table></td></tr></table></body></html>", `${unsubFooter}</table></td></tr></table></body></html>`);

      try {
        await resend.emails.send({
          from: "Alex Costea - Armata de Traderi <noreply@armatadetraderi.com>",
          to: email.email,
          subject: email.subject,
          html,
        });

        await supabase.from("email_drip_queue").update({
          status: "sent",
          sent_at: new Date().toISOString(),
        }).eq("id", email.id);

        sent++;
      } catch (sendError) {
        console.error(`Email send failed for ${email.email} (${email.template}):`, (sendError as Error).message);
        await supabase.from("email_drip_queue").update({ status: "failed" }).eq("id", email.id);
      }
    }

    return NextResponse.json({ sent, total: pendingEmails.length });
  } catch (error) {
    console.error("cron/send-emails handler error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
