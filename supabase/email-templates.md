# Email Templates pentru Supabase

Cum le setezi:
1. Supabase Dashboard → Authentication → Email Templates
2. Click pe fiecare template (Confirm signup, Reset password, Magic link)
3. Paste HTML-ul de mai jos in campul "Body"
4. Seteaza Subject-ul indicat pentru fiecare template
5. Save

Variabile Supabase disponibile:
- `{{ .ConfirmationURL }}` — link-ul de confirmare
- `{{ .Email }}` — email-ul userului
- `{{ .SiteURL }}` — URL-ul site-ului

---

## 1. Confirm Signup

**Subject:** `Confirmă contul tău — Armata de Traderi`

**Body (HTML):**

```html
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmă contul</title>
</head>
<body style="margin:0;padding:0;background-color:#06110D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06110D;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#0D1F18;border-radius:16px;border:1px solid rgba(105,224,143,0.15);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 32px 24px;">
              <div style="font-size:28px;font-weight:800;color:#69E08F;letter-spacing:-0.5px;">
                ⚔️ Armata de Traderi
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 32px 32px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">
                Bine ai venit!
              </h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#A3B8B0;text-align:center;">
                Salut! Apasă butonul de mai jos pentru a-ți confirma contul și a te alătura comunității.
              </p>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}"
                       target="_blank"
                       style="display:inline-block;padding:14px 40px;background-color:#69E08F;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                      Confirmă Contul
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(105,224,143,0.1);">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#5A7168;text-align:center;">
                Dacă nu ai cerut acest email, ignoră-l.<br>
                &copy; Armata de Traderi — armatadetraderi.com
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

## 2. Reset Password

**Subject:** `Resetare parolă — Armata de Traderi`

**Body (HTML):**

```html
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resetare parolă</title>
</head>
<body style="margin:0;padding:0;background-color:#06110D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06110D;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#0D1F18;border-radius:16px;border:1px solid rgba(105,224,143,0.15);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 32px 24px;">
              <div style="font-size:28px;font-weight:800;color:#69E08F;letter-spacing:-0.5px;">
                ⚔️ Armata de Traderi
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 32px 32px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">
                Resetare parolă
              </h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#A3B8B0;text-align:center;">
                Ai cerut resetarea parolei. Apasă butonul de mai jos pentru a seta o parolă nouă.
              </p>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}"
                       target="_blank"
                       style="display:inline-block;padding:14px 40px;background-color:#69E08F;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                      Resetează Parola
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#5A7168;text-align:center;">
                Link-ul expiră în 24 de ore.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(105,224,143,0.1);">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#5A7168;text-align:center;">
                Dacă nu ai cerut acest email, ignoră-l.<br>
                &copy; Armata de Traderi — armatadetraderi.com
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

## 3. Magic Link

**Subject:** `Link de acces — Armata de Traderi`

**Body (HTML):**

```html
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link de acces</title>
</head>
<body style="margin:0;padding:0;background-color:#06110D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06110D;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#0D1F18;border-radius:16px;border:1px solid rgba(105,224,143,0.15);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 32px 24px;">
              <div style="font-size:28px;font-weight:800;color:#69E08F;letter-spacing:-0.5px;">
                ⚔️ Armata de Traderi
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 32px 32px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#FFFFFF;text-align:center;">
                Autentificare rapidă
              </h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#A3B8B0;text-align:center;">
                Apasă butonul de mai jos pentru a te autentifica instant in contul tău.
              </p>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}"
                       target="_blank"
                       style="display:inline-block;padding:14px 40px;background-color:#69E08F;color:#06110D;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                      Intră în Cont
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(105,224,143,0.1);">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#5A7168;text-align:center;">
                Dacă nu ai cerut acest email, ignoră-l.<br>
                &copy; Armata de Traderi — armatadetraderi.com
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
