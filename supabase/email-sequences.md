# Email Sequences - Post Signup Nurture

Secventa de emailuri automate dupa signup. Se trimit prin Supabase Edge Functions sau extern.

## Cum functioneaza
1. La signup, se insereaza in `email_drip_queue` 4 emailuri programate
2. Un cron (sau Edge Function) verifica la fiecare 5 min daca sunt emailuri de trimis
3. Emailurile se trimit prin Resend/Mailgun (recomandat Resend - free 100/zi)

## Secventa (4 emailuri in 3 zile de trial)

---

### Email 1: Welcome (imediat dupa signup)
**Subject:** `Contul tau Elite e activ - uite ce sa faci prima data`
**Delay:** 0 ore

```html
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#06110D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06110D;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0D1F18;border-radius:16px;border:1px solid rgba(105,224,143,0.15);">
          <tr>
            <td align="center" style="padding:40px 32px 16px;">
              <div style="font-size:28px;font-weight:800;color:#69E08F;">🪖 Armata de Traderi</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">
                Contul tau Elite e activ
              </h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#A3B8B0;">
                Ai 3 zile acces la tot. Uite cum sa profiti la maxim:
              </p>

              <div style="background:#0A1712;border-radius:12px;padding:16px 20px;margin:0 0 12px;">
                <p style="margin:0;font-size:14px;color:#FFFFFF;font-weight:600;">1. Conecteaza-ti Discord-ul</p>
                <p style="margin:4px 0 0;font-size:13px;color:#A3B8B0;">Primesti instant acces la canalele Elite unde discutam in timp real ce se intampla pe piata.</p>
              </div>

              <div style="background:#0A1712;border-radius:12px;padding:16px 20px;margin:0 0 12px;">
                <p style="margin:0;font-size:14px;color:#FFFFFF;font-weight:600;">2. Uita-te la ultimele 3 video-uri</p>
                <p style="margin:4px 0 0;font-size:13px;color:#A3B8B0;">Sunt cele mai recente analize. Iti dau o idee clara despre cum gandesc si cum iau decizii.</p>
              </div>

              <div style="background:#0A1712;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
                <p style="margin:0;font-size:14px;color:#FFFFFF;font-weight:600;">3. Verifica portofoliul de stocks</p>
                <p style="margin:4px 0 0;font-size:13px;color:#A3B8B0;">16 actiuni cu zone exacte de Buy si Sell. Vezi unde suntem pozitionati si de ce.</p>
              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://app.armatadetraderi.com/dashboard"
                       style="display:inline-block;padding:14px 40px;background-color:#69E08F;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
                      Intra in Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;font-size:13px;color:#5A7168;text-align:center;">
                Daca ai intrebari, scrie direct pe Discord. Raspund personal.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(105,224,143,0.1);">
              <p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">
                Alex Costea - Armata de Traderi<br>armatadetraderi.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### Email 2: Valoare concreta (dupa 24h)
**Subject:** `Greseala #1 care costa bani pe 90% din traderi`
**Delay:** 24 ore

```html
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#06110D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06110D;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0D1F18;border-radius:16px;border:1px solid rgba(105,224,143,0.15);">
          <tr>
            <td align="center" style="padding:40px 32px 16px;">
              <div style="font-size:28px;font-weight:800;color:#69E08F;">🪖 Armata de Traderi</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">
                Greseala care costa cel mai mult
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A3B8B0;">
                Stii care e diferenta intre un trader care face bani si unul care pierde?
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A3B8B0;">
                Nu e analiza tehnica. Nu e timing-ul. Nu e "alfa" pe care il gasesti pe Twitter.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#FFFFFF;font-weight:600;">
                E cat de mult risc pui pe un singur trade.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A3B8B0;">
                Majoritatea pun 10-20% din portofoliu pe o singura idee. Cand merge, se simt genii. Cand nu merge - si la un moment dat nu va merge - pierd luni de progres intr-o zi.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A3B8B0;">
                In comunitatea Elite lucram cu regula de 1-2%. Niciodata mai mult pe o singura pozitie. Pare putin, dar compound interest face restul.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#A3B8B0;">
                Am un video in care explic exact cum calculez sizing-ul pe fiecare trade. Il gasesti in biblioteca video:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://app.armatadetraderi.com/dashboard/videos"
                       style="display:inline-block;padding:14px 40px;background-color:#69E08F;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
                      Vezi Video-urile Elite
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;font-size:13px;color:#5A7168;text-align:center;">
                PS: Maine iti trimit ce spun membrii care sunt de cateva luni in comunitate.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(105,224,143,0.1);">
              <p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">
                Alex Costea - Armata de Traderi<br>armatadetraderi.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### Email 3: Social proof + urgenta (dupa 48h)
**Subject:** `"De cand am intrat in Elite, sunt pe plus" - Daniel`
**Delay:** 48 ore

```html
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#06110D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06110D;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0D1F18;border-radius:16px;border:1px solid rgba(105,224,143,0.15);">
          <tr>
            <td align="center" style="padding:40px 32px 16px;">
              <div style="font-size:28px;font-weight:800;color:#69E08F;">🪖 Armata de Traderi</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">
                Nu trebuie sa ma crezi pe cuvant
              </h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#A3B8B0;">
                Uite ce zic oamenii care sunt deja in comunitate:
              </p>

              <div style="background:#0A1712;border-radius:12px;padding:20px;margin:0 0 14px;border-left:3px solid #69E08F;">
                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#A3B8B0;font-style:italic;">
                  "De cand am intrat in Elite, sunt in sfarsit pe plus. Alex este foarte metodic, calculat, si STIE MULTE!"
                </p>
                <p style="margin:0;font-size:13px;color:#69E08F;font-weight:600;">Daniel - membru din octombrie 2025</p>
              </div>

              <div style="background:#0A1712;border-radius:12px;padding:20px;margin:0 0 14px;border-left:3px solid #69E08F;">
                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#A3B8B0;font-style:italic;">
                  "Partea de risk management mi-a schimbat complet modul de a gandi. Nu a fost genul ala de informatie aruncata peste tine, ci explicata pe bune."
                </p>
                <p style="margin:0;font-size:13px;color:#69E08F;font-weight:600;">Alex Ivana - membru din martie 2026</p>
              </div>

              <div style="background:#0A1712;border-radius:12px;padding:20px;margin:0 0 14px;border-left:3px solid #69E08F;">
                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#A3B8B0;font-style:italic;">
                  "Este mereu prezent si gata sa raspunda, sa explice, sa ajute. Oamenii din comunitate sunt faini, activi, haiosi."
                </p>
                <p style="margin:0;font-size:13px;color:#69E08F;font-weight:600;">Liviu Parepa - membru din octombrie 2025</p>
              </div>

              <div style="background:rgba(245,158,11,0.08);border-radius:12px;padding:20px;margin:24px 0;border:1px solid rgba(245,158,11,0.2);">
                <p style="margin:0;font-size:15px;line-height:1.7;color:#F59E0B;font-weight:600;text-align:center;">
                  Trial-ul tau expira maine.
                </p>
                <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#A3B8B0;text-align:center;">
                  Daca ti-a placut ce ai vazut, alege un plan si ramai in echipa.
                </p>
              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://app.armatadetraderi.com/upgrade"
                       style="display:inline-block;padding:14px 40px;background-color:#69E08F;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
                      Alege un Plan
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(105,224,143,0.1);">
              <p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">
                Alex Costea - Armata de Traderi<br>armatadetraderi.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### Email 4: Ultimele ore (dupa 65h)
**Subject:** `Accesul tau Elite se inchide in cateva ore`
**Delay:** 65 ore

```html
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#06110D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06110D;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0D1F18;border-radius:16px;border:1px solid rgba(105,224,143,0.15);">
          <tr>
            <td align="center" style="padding:40px 32px 16px;">
              <div style="font-size:28px;font-weight:800;color:#69E08F;">🪖 Armata de Traderi</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">
                Accesul Elite se inchide azi
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#A3B8B0;">
                Dupa expirare, contul tau ramane activ dar pierzi accesul la:
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr><td style="padding:5px 0;font-size:14px;color:#A3B8B0;">Canalele private Discord cu analize live</td></tr>
                <tr><td style="padding:5px 0;font-size:14px;color:#A3B8B0;">Cele 55+ video-uri de trading</td></tr>
                <tr><td style="padding:5px 0;font-size:14px;color:#A3B8B0;">Indicatorii Elite pe TradingView</td></tr>
                <tr><td style="padding:5px 0;font-size:14px;color:#A3B8B0;">Portofoliul de stocks cu Buy/Sell zones</td></tr>
                <tr><td style="padding:5px 0;font-size:14px;color:#A3B8B0;">Sesiunile live saptamanale</td></tr>
              </table>

              <div style="background:#0A1712;border-radius:12px;padding:20px;margin:0 0 24px;">
                <p style="margin:0 0 4px;font-size:13px;color:#5A7168;">Cel mai popular plan:</p>
                <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#FFFFFF;">3 Luni - $137</p>
                <p style="margin:0;font-size:13px;color:#69E08F;">Indicatori deblocati instant, fara perioada de asteptare de 31 zile</p>
              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://app.armatadetraderi.com/upgrade"
                       style="display:inline-block;padding:14px 40px;background-color:#69E08F;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
                      Continua cu Elite
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;font-size:13px;color:#5A7168;text-align:center;">
                Daca nu vrei sa continui, nu trebuie sa faci nimic. Contul ramane, dar accesul Elite se opreste automat.
              </p>

              <p style="margin:16px 0 0;font-size:13px;color:#5A7168;text-align:center;">
                Intrebari? Scrie-mi pe Discord sau raspunde la acest email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(105,224,143,0.1);">
              <p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">
                Alex Costea - Armata de Traderi<br>armatadetraderi.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Implementare

Emailurile necesita un provider SMTP. Recomandat: Resend (resend.com) - free 100 emails/zi.

### Tabel email_drip_queue
```sql
CREATE TABLE email_drip_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  email text NOT NULL,
  template text NOT NULL,
  subject text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
```

### La signup, se insereaza automat (vezi app/auth/actions.ts):
- welcome (0h)
- value_day1 (24h)
- social_proof (48h)
- trial_expiry (65h)
