# 🚀 CoachFlow - Quick Start Guide

## Schnellstart in 5 Schritten

### 1️⃣ Stripe einrichten (5 Minuten)

1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com)
2. Kopiere deine API Keys:
   - `pk_test_...` → STRIPE_PUBLISHABLE_KEY
   - `sk_test_...` → STRIPE_SECRET_KEY

3. Erstelle 3 Produkte (Products → Add Product):
   - Basic: 49€/Monat (monatlich wiederkehrend)
   - Premium: 199€/Monat (monatlich wiederkehrend)
   - Elite: 399€/Monat (monatlich wiederkehrend)
   
4. Kopiere die 3 Price IDs (beginnen mit `price_...`)

### 2️⃣ Supabase einrichten (10 Minuten)

1. Gehe zu [Supabase](https://app.supabase.com)
2. Erstelle ein neues Projekt
3. Warte, bis das Projekt bereit ist (ca. 2 Minuten)
4. Gehe zu SQL Editor
5. Kopiere den Inhalt von `supabase/schema.sql`
6. Füge ihn ein und klicke "Run"
7. Gehe zu Settings → API und kopiere:
   - URL → SUPABASE_URL
   - anon key → SUPABASE_ANON_KEY
   - service_role key → SUPABASE_SERVICE_KEY

### 3️⃣ Resend einrichten (2 Minuten)

1. Gehe zu [Resend](https://resend.com/api-keys)
2. Erstelle einen API Key
3. Kopiere den Key → RESEND_API_KEY

### 4️⃣ Zu Netlify deployen (5 Minuten)

**Option A: GitHub Integration (empfohlen)**

```bash
# 1. Push zu GitHub
git remote add origin https://github.com/YOUR-USERNAME/coachflow.git
git push -u origin master

# 2. Gehe zu Netlify → New site from Git
# 3. Wähle dein Repository
# 4. Settings:
#    - Build command: echo 'No build'
#    - Publish directory: .
#    - Functions directory: netlify/functions
```

**Option B: Netlify CLI**

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### 5️⃣ Environment Variables setzen (5 Minuten)

In Netlify Dashboard → Site Settings → Environment Variables:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (wird in Schritt 6 hinzugefügt)
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PREMIUM=price_...
STRIPE_PRICE_ELITE=price_...
SUPABASE_URL=https://....supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
RESEND_API_KEY=re_...
```

### 6️⃣ Stripe Webhook einrichten (3 Minuten)

1. Gehe zu Stripe Dashboard → Developers → Webhooks
2. Klicke "Add endpoint"
3. URL: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
4. Events auswählen:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Kopiere "Signing secret" → STRIPE_WEBHOOK_SECRET (als Environment Variable in Netlify hinzufügen)

## ✅ Fertig!

Deine CoachFlow-Plattform ist jetzt live! 🎉

### Nächste Schritte:

1. **Teste die Anmeldung**:
   - Öffne `https://your-site.netlify.app`
   - Wähle einen Plan
   - Verwende Stripe Testkarte: `4242 4242 4242 4242`

2. **Coach Dashboard testen**:
   - Nach erfolgreicher Zahlung erhältst du eine E-Mail
   - Logge dich im Dashboard ein
   - Verbinde Stripe Connect (Test-Daten verwenden)
   - Erstelle ein Tier
   - Lade Testinhalte hoch

3. **Kunden-Portal testen**:
   - Kopiere deinen Membership-Link
   - Öffne ihn in einem Inkognito-Fenster
   - Registriere dich als Testkunde
   - Zahle mit Testkarte
   - Sieh dir die Inhalte an

## 🧪 Stripe Test-Karten

- **Erfolgreiche Zahlung**: 4242 4242 4242 4242
- **Fehlschlag (Karte abgelehnt)**: 4000 0000 0000 0002
- **3D Secure erforderlich**: 4000 0027 6000 3184

CVV: Beliebig (z.B. 123)
Ablaufdatum: Beliebig in der Zukunft (z.B. 12/25)

## 🔧 Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# .env-Datei erstellen
cp .env.example .env
# Fülle die Werte aus

# Netlify Dev Server starten
netlify dev

# App läuft auf http://localhost:8888
```

## 📚 Weitere Ressourcen

- Ausführliche Dokumentation: `README.md`
- Supabase Schema: `supabase/schema.sql`
- Netlify Functions: `netlify/functions/`

## 🆘 Hilfe benötigt?

- GitHub Issues: [Link zum Repository]
- E-Mail: support@coachflow.de
- Troubleshooting: Siehe README.md → Troubleshooting-Sektion

---

Viel Erfolg mit CoachFlow! 🚀
