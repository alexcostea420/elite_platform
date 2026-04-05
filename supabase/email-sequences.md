# Email Sequences - Post Signup Nurture

Secventa de emailuri automate dupa signup. Se trimit prin Supabase Edge Functions sau extern.

## Cum functioneaza
1. La signup, se insereaza in `email_drip_queue` 4 emailuri programate
2. Un cron (sau Edge Function) verifica la fiecare 5 min daca sunt emailuri de trimis
3. Emailurile se trimit prin Supabase Auth SMTP (sau Resend/Mailgun cand e configurat)

## Secventa (4 emailuri in 3 zile de trial)

---

### Email 1: Welcome (imediat dupa signup)
**Subject:** `Bine ai venit in Armata de Traderi!`
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
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">
                Bine ai venit, soldat!
              </h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#A3B8B0;">
                Ai 3 zile de acces complet la tot ce oferim. Fara card, fara obligatii.
              </p>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#A3B8B0;">
                Ce poti face acum:
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="padding:6px 0;font-size:14px;color:#A3B8B0;">✅ Conecteaza Discord - primesti rolul Elite automat</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#A3B8B0;">✅ Exploreaza video-urile - 55+ lectii de trading</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#A3B8B0;">✅ Vezi portofoliul de stocks - 16 actiuni cu zone de Buy/Sell</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#A3B8B0;">✅ Intra pe chat - intreaba orice</td></tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://app.armatadetraderi.com/dashboard"
                       style="display:inline-block;padding:14px 40px;background-color:#69E08F;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
                      Mergi la Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(105,224,143,0.1);">
              <p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">
                Ai primit acest email pentru ca ti-ai creat cont pe armatadetraderi.com<br>
                &copy; Armata de Traderi
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

### Email 2: Valoare (dupa 24h)
**Subject:** `3 lucruri pe care le fac inainte de fiecare trade`
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
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">
                3 lucruri pe care le fac inainte de fiecare trade
              </h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#A3B8B0;">
                Majoritatea traderilor pierd bani pentru ca nu au un proces. Eu folosesc aceste 3 reguli de fiecare data:
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#FFFFFF;font-weight:600;">
                1. Stabilesc riscul INAINTE sa intru
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#A3B8B0;">
                Niciodata mai mult de 1-2% din portofoliu pe un singur trade. Daca pierd, pierd putin. Daca castig, castig mult.
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#FFFFFF;font-weight:600;">
                2. Verific structura pietei
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#A3B8B0;">
                Higher highs si higher lows = trend bullish. Lower highs si lower lows = trend bearish. Nu tranzactionez impotriva trendului.
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#FFFFFF;font-weight:600;">
                3. Astept confirmarea
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#A3B8B0;">
                Nu intru la "feeling". Astept un semnal clar: un bounce de pe suport, un break de rezistenta, un pattern pe volum. Rabdarea e cea mai importanta abilitate.
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#A3B8B0;">
                Vrei sa vezi cum aplic asta in practica? Am 55+ video-uri in biblioteca Elite unde explic fiecare decizie.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://app.armatadetraderi.com/dashboard/videos"
                       style="display:inline-block;padding:14px 40px;background-color:#69E08F;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
                      Vezi Video-urile
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(105,224,143,0.1);">
              <p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">
                &copy; Armata de Traderi - armatadetraderi.com
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

### Email 3: Social proof (dupa 48h)
**Subject:** `Ce spun membrii despre Armata de Traderi`
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
                Ce spun membrii
              </h1>

              <div style="background:#0A1712;border-radius:12px;padding:20px;margin:0 0 16px;border-left:3px solid #69E08F;">
                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#A3B8B0;font-style:italic;">
                  "Partea de risk management mi-a schimbat complet modul de a gandi - cred ca acolo a fost cel mai mare aha."
                </p>
                <p style="margin:0;font-size:13px;color:#69E08F;font-weight:600;">- Alex Ivana, Membru Elite</p>
              </div>

              <div style="background:#0A1712;border-radius:12px;padding:20px;margin:0 0 16px;border-left:3px solid #69E08F;">
                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#A3B8B0;font-style:italic;">
                  "Am invatat analiza tehnica si cum sa inteleg mai bine structura pietei. Totul este explicat clar si aplicabil, nu doar teorie."
                </p>
                <p style="margin:0;font-size:13px;color:#69E08F;font-weight:600;">- Polishboy, Membru Elite</p>
              </div>

              <div style="background:#0A1712;border-radius:12px;padding:20px;margin:0 0 24px;border-left:3px solid #69E08F;">
                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#A3B8B0;font-style:italic;">
                  "De cand am intrat in Elite, sunt in sfarsit pe plus. Alex este foarte metodic, calculat, si STIE MULTE!"
                </p>
                <p style="margin:0;font-size:13px;color:#69E08F;font-weight:600;">- Daniel, Membru Elite</p>
              </div>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#A3B8B0;text-align:center;">
                Trial-ul tau expira maine. Alege un plan si ramai in echipa.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://app.armatadetraderi.com/upgrade"
                       style="display:inline-block;padding:14px 40px;background-color:#69E08F;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
                      Vezi Planurile
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(105,224,143,0.1);">
              <p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">
                &copy; Armata de Traderi - armatadetraderi.com
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

### Email 4: Ultima zi (dupa 65h - ultimele ore de trial)
**Subject:** `Trial-ul tau expira azi`
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
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">
                Trial-ul tau expira azi
              </h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#A3B8B0;">
                Dupa expirare, pierzi accesul la:
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="padding:6px 0;font-size:14px;color:#A3B8B0;">❌ Discord Elite - canalele private</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#A3B8B0;">❌ 55+ video-uri de trading</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#A3B8B0;">❌ Indicatori TradingView Elite</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#A3B8B0;">❌ Portofoliu stocks cu Buy/Sell zones</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#A3B8B0;">❌ Analize si sesiuni live</td></tr>
              </table>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#A3B8B0;">
                Planul de 30 zile e $49. Daca alegi 3 luni ($137) primesti acces instant la indicatori fara perioada de asteptare.
              </p>
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
              <p style="margin:20px 0 0;font-size:13px;color:#5A7168;text-align:center;">
                Daca nu vrei sa continui, nu trebuie sa faci nimic. Contul ramane, doar accesul Elite se opreste.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(105,224,143,0.1);">
              <p style="margin:0;font-size:12px;color:#5A7168;text-align:center;">
                &copy; Armata de Traderi - armatadetraderi.com
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

Emailurile necesita un provider SMTP. Optiuni:
1. **Supabase SMTP** - limitat la auth emails, nu suporta custom drip
2. **Resend** - free tier 100 emails/zi, API simplu
3. **Mailgun** - free tier 100 emails/zi

Recomandat: Resend (resend.com) - se integreaza usor cu Next.js.

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
  status text DEFAULT 'pending'
);
```

### La signup, insereaza:
```sql
INSERT INTO email_drip_queue (user_id, email, template, subject, scheduled_at) VALUES
(user_id, email, 'welcome', 'Bine ai venit in Armata de Traderi!', NOW()),
(user_id, email, 'value_day1', '3 lucruri pe care le fac inainte de fiecare trade', NOW() + interval '24 hours'),
(user_id, email, 'social_proof', 'Ce spun membrii despre Armata de Traderi', NOW() + interval '48 hours'),
(user_id, email, 'trial_expiry', 'Trial-ul tau expira azi', NOW() + interval '65 hours');
```
