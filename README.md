# 🚀 CoachFlow - SaaS-Plattform für Coaches

Eine vollständige SaaS-Lösung für Fitness- und Yoga-Coaches, die eigene Membership-Websites anbieten möchten.

## 📋 Inhaltsverzeichnis

- [Überblick](#überblick)
- [Features](#features)
- [Technologie-Stack](#technologie-stack)
- [Voraussetzungen](#voraussetzungen)
- [Installation](#installation)
- [Konfiguration](#konfiguration)
- [Deployment](#deployment)
- [Verwendung](#verwendung)
- [Projektstruktur](#projektstruktur)
- [Troubleshooting](#troubleshooting)

## 🎯 Überblick

CoachFlow ermöglicht es Coaches:
- Eine eigene Membership-Website zu erstellen
- Inhalte (Videos, PDFs, Bilder) hochzuladen
- Zahlungen von Kunden zu empfangen (direkt auf ihr Girokonto)
- Mitglieder zu verwalten

### Geschäftsmodell

- **Coaches** zahlen monatlich an den Plattform-Betreiber (49€/199€/399€)
- **Kunden** der Coaches zahlen direkt an den Coach via Stripe Connect
- Geld geht direkt auf das Girokonto des Coaches

## ✨ Features

### Landing Page
- Hero-Section mit Erklärung
- Features-Übersicht
- Preisgestaltung (Basic/Premium/Elite)
- Stripe Checkout Integration
- Links zu AGB, Datenschutz, Impressum

### Coach Dashboard
- **Tier-Konfigurator**: 1 Tier mit Name, Preis, Beschreibung
- **Upload-System**: Videos, PDFs, Bilder hochladen
- **Stripe Connect**: Girokonto verbinden
- **Membership-Link**: Teilbarer Link für Kunden
- **Statistiken**: Mitglieder-Anzahl, Inhalte-Anzahl

### Kunden-Portal
- Login/Registrierung
- Tier-Informationen anzeigen
- Stripe Checkout für Mitgliedschaft
- Zugriff auf alle Inhalte nach Zahlung
- Video-Player, PDF-Viewer, Bild-Anzeige

## 🛠 Technologie-Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Backend**: Netlify Serverless Functions
- **Datenbank**: Supabase (PostgreSQL)
- **Authentifizierung**: Supabase Auth
- **Speicher**: Supabase Storage
- **Zahlungen**: Stripe Connect (Express)
- **E-Mail**: Resend.com
- **Hosting**: Netlify

## 📦 Voraussetzungen

Bevor du beginnst, stelle sicher, dass du folgende Accounts hast:

1. **Stripe Account**: [stripe.com](https://stripe.com)
   - Test-Modus für Entwicklung
   - Live-Modus für Produktion

2. **Supabase Account**: [supabase.com](https://supabase.com)
   - Erstelle ein neues Projekt

3. **Resend Account**: [resend.com](https://resend.com)
   - Für E-Mail-Versand

4. **Netlify Account**: [netlify.com](https://netlify.com)
   - Für Hosting und Functions

5. **Git/GitHub Account**: Für Version Control

## 🔧 Installation

### 1. Repository klonen oder erstellen

```bash
# Wenn du ein neues Repository erstellst:
mkdir coachflow
cd coachflow

# Oder klone dieses Repository:
git clone <your-repo-url>
cd coachflow
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Umgebungsvariablen einrichten

```bash
cp .env.example .env
```

Öffne `.env` und füge deine API-Keys ein (siehe [Konfiguration](#konfiguration)).

## ⚙️ Konfiguration

### Stripe einrichten

1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigiere zu **Developers** > **API Keys**
3. Kopiere:
   - Publishable Key → `STRIPE_PUBLISHABLE_KEY`
   - Secret Key → `STRIPE_SECRET_KEY`

4. Erstelle Produkte und Preise:
   - Gehe zu **Products** > **Create Product**
   - Erstelle 3 Produkte:
     - Basic (49€/Monat)
     - Premium (199€/Monat)
     - Elite (399€/Monat)
   - Kopiere die Price IDs → `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PREMIUM`, `STRIPE_PRICE_ELITE`

5. Aktiviere Stripe Connect:
   - Gehe zu **Connect** > **Settings**
   - Aktiviere Express Accounts

6. Erstelle Webhook:
   - Gehe zu **Developers** > **Webhooks**
   - Klicke auf **Add endpoint**
   - URL: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
   - Events auswählen:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`
   - Kopiere Signing Secret → `STRIPE_WEBHOOK_SECRET`

### Supabase einrichten

1. Gehe zu [Supabase Dashboard](https://app.supabase.com)
2. Erstelle ein neues Projekt
3. Navigiere zu **Settings** > **API**
4. Kopiere:
   - URL → `SUPABASE_URL`
   - Anon Key → `SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_KEY` ⚠️ (Niemals im Frontend verwenden!)

5. Datenbank einrichten:
   - Gehe zu **SQL Editor**
   - Öffne `supabase/schema.sql`
   - Kopiere den gesamten Inhalt
   - Füge ihn in den SQL Editor ein
   - Klicke auf **Run**

6. Storage einrichten:
   - Die Buckets werden automatisch durch das Schema erstellt
   - Überprüfe unter **Storage**, ob `videos`, `documents`, `images` existieren

7. Auth konfigurieren:
   - Gehe zu **Authentication** > **Settings**
   - Aktiviere **Email** als Provider
   - Optional: Deaktiviere E-Mail-Bestätigung für Testing

### Resend einrichten

1. Gehe zu [Resend Dashboard](https://resend.com/api-keys)
2. Erstelle einen neuen API Key
3. Kopiere den Key → `RESEND_API_KEY`

4. Domain verifizieren (optional, für Produktion):
   - Gehe zu **Domains**
   - Füge deine Domain hinzu
   - Folge den DNS-Anweisungen

### Netlify einrichten

Siehe [Deployment](#deployment) weiter unten.

## 🚀 Deployment

### Lokale Entwicklung

```bash
# Starte den Netlify Dev Server
netlify dev

# Die App läuft auf http://localhost:8888
```

### Deployment zu Netlify

#### Option 1: Netlify CLI

```bash
# Installiere Netlify CLI (falls noch nicht installiert)
npm install -g netlify-cli

# Login zu Netlify
netlify login

# Erstelle eine neue Site
netlify init

# Deploy
netlify deploy --prod
```

#### Option 2: GitHub Integration

1. Pushe deinen Code zu GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

2. Gehe zu [Netlify Dashboard](https://app.netlify.com)
3. Klicke auf **Add new site** > **Import an existing project**
4. Wähle **GitHub** und autorisiere Netlify
5. Wähle dein Repository
6. Build-Einstellungen:
   - Build command: `echo 'No build step required'`
   - Publish directory: `.`
   - Functions directory: `netlify/functions`
7. Klicke auf **Deploy site**

### Umgebungsvariablen in Netlify setzen

1. Gehe zu deiner Site in Netlify
2. Navigiere zu **Site settings** > **Environment variables**
3. Klicke auf **Add a variable**
4. Füge alle Variablen aus `.env.example` hinzu:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_BASIC`
   - `STRIPE_PRICE_PREMIUM`
   - `STRIPE_PRICE_ELITE`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `RESEND_API_KEY`

5. Die Variable `URL` wird automatisch von Netlify gesetzt

### Nach dem Deployment

1. **Stripe Webhook aktualisieren**:
   - Gehe zu Stripe Dashboard > Webhooks
   - Aktualisiere die Webhook-URL auf: `https://your-actual-site.netlify.app/.netlify/functions/stripe-webhook`

2. **Teste die Anwendung**:
   - Öffne `https://your-site.netlify.app`
   - Registriere einen Test-Coach
   - Teste den Stripe Checkout (verwende Test-Karten: `4242 4242 4242 4242`)

## 📖 Verwendung

### Als Plattform-Betreiber

1. Stelle die Landing Page online
2. Coaches können sich anmelden und einen Plan wählen
3. Nach erfolgreicher Zahlung erhalten Coaches:
   - Zugang zum Dashboard
   - Onboarding-E-Mail mit Anleitung
   - Link zum Stripe Connect Onboarding

### Als Coach

1. **Registrierung**:
   - Gehe zur Landing Page
   - Wähle einen Plan (Basic/Premium/Elite)
   - Fülle das Formular aus
   - Schließe Stripe Checkout ab

2. **Dashboard-Setup**:
   - Logge dich im Dashboard ein
   - Verbinde dein Girokonto (Stripe Connect)
   - Erstelle dein Membership-Tier (Name, Preis, Beschreibung)
   - Lade Inhalte hoch (Videos, PDFs, Bilder)

3. **Kunden gewinnen**:
   - Kopiere deinen Membership-Link
   - Teile ihn auf Social Media, Website, etc.
   - Kunden können sich direkt anmelden und bezahlen

### Als Kunde

1. **Anmeldung**:
   - Klicke auf den Membership-Link deines Coaches
   - Sieh dir das Tier-Angebot an
   - Registriere dich oder logge dich ein
   - Schließe Stripe Checkout ab

2. **Inhalte ansehen**:
   - Nach erfolgreicher Zahlung: Zugriff auf alle Inhalte
   - Videos abspielen, PDFs öffnen, Bilder anzeigen
   - Jederzeit über das Portal zugreifen

## 📁 Projektstruktur

```
coachflow/
├── index.html                  # Landing Page
├── landing.js                  # Landing Page Logic
├── dashboard.html              # Coach Dashboard
├── dashboard.js                # Dashboard Logic
├── member-portal.html          # Kunden-Portal
├── member-portal.js            # Portal Logic
├── styles.css                  # Globale Styles
├── agb.html                    # AGB
├── datenschutz.html            # Datenschutzerklärung
├── impressum.html              # Impressum
├── netlify.toml                # Netlify Konfiguration
├── package.json                # NPM Dependencies
├── .env.example                # Umgebungsvariablen Template
├── .gitignore                  # Git Ignore
├── README.md                   # Diese Datei
├── netlify/
│   └── functions/
│       ├── create-coach-checkout.js      # Stripe Checkout für Coaches
│       ├── stripe-webhook.js              # Stripe Webhook Handler
│       ├── create-connect-account.js      # Stripe Connect Account erstellen
│       ├── create-customer-checkout.js    # Stripe Checkout für Kunden
│       ├── create-tier-price.js           # Tier-Preis in Stripe erstellen
│       └── upload-content.js              # Content-Upload Metadata
└── supabase/
    └── schema.sql              # Datenbank-Schema

```

## 🐛 Troubleshooting

### Stripe Checkout funktioniert nicht

**Problem**: Fehler beim Öffnen des Stripe Checkouts

**Lösung**:
1. Überprüfe, ob `STRIPE_PUBLISHABLE_KEY` korrekt gesetzt ist
2. Öffne die Browser-Konsole (F12) und suche nach Fehlern
3. Stelle sicher, dass Stripe.js geladen ist: `<script src="https://js.stripe.com/v3/"></script>`

### Supabase Auth funktioniert nicht

**Problem**: Login/Registrierung schlägt fehl

**Lösung**:
1. Überprüfe `SUPABASE_URL` und `SUPABASE_ANON_KEY`
2. Stelle sicher, dass die Supabase Auth aktiviert ist (Dashboard > Authentication)
3. Überprüfe die RLS Policies in der Datenbank

### Netlify Functions geben 500-Fehler zurück

**Problem**: Functions schlagen fehl

**Lösung**:
1. Überprüfe die Netlify Function Logs: Site > Functions > [Function Name] > Logs
2. Stelle sicher, dass alle Umgebungsvariablen gesetzt sind
3. Überprüfe, ob `SUPABASE_SERVICE_KEY` (nicht Anon Key!) verwendet wird

### Upload schlägt fehl

**Problem**: Datei-Upload funktioniert nicht

**Lösung**:
1. Überprüfe Supabase Storage Policies
2. Stelle sicher, dass die Buckets existieren: `videos`, `documents`, `images`
3. Überprüfe Dateigrößen-Limit (Max. 500MB)

### Stripe Connect Onboarding funktioniert nicht

**Problem**: Fehler beim Verbinden des Girokontos

**Lösung**:
1. Stelle sicher, dass Stripe Connect aktiviert ist
2. Überprüfe die Return URL in `create-connect-account.js`
3. Verwende Test-Daten für Development: [Stripe Test Data](https://stripe.com/docs/connect/testing)

### E-Mails werden nicht versendet

**Problem**: Onboarding-E-Mails kommen nicht an

**Lösung**:
1. Überprüfe `RESEND_API_KEY`
2. Überprüfe die Netlify Function Logs für Resend-Fehler
3. Verifiziere deine Domain in Resend (für Produktion)

### Videos werden nicht abgespielt

**Problem**: Video-Player zeigt nichts an

**Lösung**:
1. Überprüfe, ob die Video-URL korrekt ist
2. Stelle sicher, dass das Video-Format unterstützt wird (MP4, WebM)
3. Überprüfe Supabase Storage Policies (Public Access für Videos)

## 📊 Datenbank-Schema

### Tabellen

- **coaches**: Coach-Daten (E-Mail, Name, Plan, Stripe-Daten)
- **tiers**: Membership-Tiers (Name, Preis, Beschreibung)
- **content**: Hochgeladene Inhalte (Videos, PDFs, Bilder)
- **customers**: Kunden/Mitglieder (E-Mail, Subscription-Status)

### Row Level Security (RLS)

- Coaches können nur ihre eigenen Daten lesen/schreiben
- Kunden können nur ihre eigenen Subscriptions sehen
- Tier-Informationen sind öffentlich lesbar
- Content ist öffentlich lesbar (Access Control erfolgt im Frontend)

## 🔐 Sicherheit

### Best Practices

1. **API Keys**:
   - Niemals `STRIPE_SECRET_KEY` oder `SUPABASE_SERVICE_KEY` im Frontend verwenden
   - Verwende immer die Anon Keys im Frontend
   - Setze alle sensiblen Keys als Netlify Environment Variables

2. **RLS Policies**:
   - Aktiviere Row Level Security auf allen Tabellen
   - Teste die Policies gründlich

3. **Stripe Webhooks**:
   - Validiere Webhook-Signaturen
   - Verwende `STRIPE_WEBHOOK_SECRET`

4. **CORS**:
   - Konfiguriere CORS in `netlify.toml`
   - Begrenze auf deine Domain (Produktion)

## 📈 Nächste Schritte

### Features für v2.0

- [ ] Multiple Tiers pro Coach
- [ ] Live-Streaming Integration
- [ ] Community/Forum
- [ ] Analytics Dashboard für Coaches
- [ ] Affiliate-Programm
- [ ] Mobile Apps (React Native)

### Optimierungen

- [ ] CDN für Video-Streaming (z.B. Cloudflare Stream)
- [ ] Image Optimization
- [ ] PWA Support
- [ ] SEO Optimization
- [ ] Performance Monitoring

## 🤝 Support

Bei Fragen oder Problemen:

1. Öffne ein Issue auf GitHub
2. E-Mail an: support@coachflow.de
3. Discord-Community: [Link]

## 📄 Lizenz

MIT License - Siehe LICENSE Datei

## 🙏 Credits

Entwickelt mit:
- [Stripe](https://stripe.com)
- [Supabase](https://supabase.com)
- [Netlify](https://netlify.com)
- [Resend](https://resend.com)

---

**CoachFlow** - Deine SaaS-Plattform für Coaches 🚀
