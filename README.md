# 🏋️ CoachFlow - Premium Fitness Training Platform

![Status](https://img.shields.io/badge/status-active-success)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

Eine moderne, DSGVO-konforme SaaS-Plattform für Personal Training mit Vanilla JS, Supabase Backend und Stripe Payments.

## 🚀 Live Demo

- **Produktion**: https://coachflow1.netlify.app/
- **Status**: https://coachflow1.netlify.app/

## 📋 Features

- ✅ **3 Subscription-Pläne**: Basis (€29), Premium (€59), Elite (€99)
- ✅ **Upgrade/Downgrade**: Jederzeit zwischen Plänen wechseln
- ✅ **Content Management**: Videos, Dokumente, Bilder mit Zugriffskontrolle
- ✅ **Stripe Integration**: Sichere Zahlungsabwicklung
- ✅ **Supabase Backend**: Authentifizierung & Datenspeicherung
- ✅ **DSGVO-konform**: Cookie-Banner, Datenschutz, Impressum, AGB
- ✅ **Responsive Design**: Mobile-first Ansatz
- ✅ **Demo-Modus**: Funktioniert auch ohne Stripe für Testing

## 🔧 Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Stripe Connect & Subscriptions
- **Emails**: Resend API
- **Hosting**: Netlify
- **Build**: Node.js

## 🐛 Häufige Deployment-Probleme

### **Problem: 404 "Page not found" Error auf Netlify**

#### Ursache
Die Seite zeigt einen 404-Fehler, weil der Build-Prozess ohne die erforderlichen Environment Variables fehlschlägt oder keine Dateien in das `dist/` Verzeichnis kopiert.

#### Lösung

**1. Setze die Environment Variables in Netlify:**

Gehe zu deinem Netlify Dashboard:
```
Site Settings → Build & Deploy → Environment → Environment variables
```

Füge folgende Variablen hinzu:

| Variable | Wert | Pflicht |
|----------|------|---------|
| `SUPABASE_URL` | `https://your-project.supabase.co` | ✅ JA |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | ✅ JA |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_51...` | ⚠️ Optional* |

*\*Ohne Stripe läuft die App im Demo-Modus*

**2. Finde deine Supabase Credentials:**

1. Gehe zu: https://app.supabase.com/project/YOUR_PROJECT/settings/api
2. Kopiere **Project URL** → `SUPABASE_URL`
3. Kopiere **anon/public key** → `SUPABASE_ANON_KEY`

**3. Trigger einen Rebuild:**

```bash
# Option 1: Im Netlify Dashboard
Deploys → Trigger deploy → Deploy site

# Option 2: Via CLI
netlify deploy --prod
```

**4. Überprüfe den Build-Log:**

Nach dem Deployment solltest du sehen:
```
✅ SUPABASE_URL: https://ftohghotvfgkoeclmw...
✅ SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIs...
✅ Build erfolgreich abgeschlossen!
```

### **Problem: Build funktioniert, aber Seite zeigt "DEIN_SUPABASE_URL"**

Dies bedeutet, dass die Environment Variables nicht korrekt ersetzt wurden.

**Lösung:**
1. Überprüfe die Schreibweise der Environment Variables (exakt wie oben)
2. Stelle sicher, dass keine Leerzeichen am Anfang/Ende der Werte sind
3. Trigger einen neuen Deploy

## 📦 Lokale Entwicklung

### Voraussetzungen

- Node.js >= 14.0.0
- Git
- Ein Supabase-Projekt
- (Optional) Ein Stripe-Account

### Installation

```bash
# Repository klonen
git clone https://github.com/yourusername/coachflow.git
cd coachflow

# Environment Variables setzen
cp .env.example .env
# Bearbeite .env und füge deine Credentials ein

# Build ausführen
npm run build

# Lokalen Server starten
npm run dev
```

### Build-Befehle

```bash
# Build erstellen
npm run build

# Entwicklungsserver starten (root directory)
npm run dev

# Entwicklungsserver für dist/ Ordner
npm run serve:dist

# Dist-Ordner löschen
npm run clean

# Clean + Build
npm run rebuild
```

## 🗂️ Projektstruktur

```
coachflow/
├── dist/                    # Build-Output (automatisch generiert)
│   ├── index.html
│   ├── app.js              # Mit Credentials injiziert
│   ├── styles.css
│   ├── viewer.html
│   ├── success.html
│   └── _redirects
├── index.html              # Haupt-HTML
├── app.js                  # Haupt-JavaScript (mit Platzhaltern)
├── styles.css              # Styling
├── viewer.html             # Content-Viewer für Videos/Dokumente
├── agb.html               # AGB-Seite
├── datenschutz.html       # Datenschutzerklärung
├── impressum.html         # Impressum
├── cookies.html           # Cookie-Richtlinien
├── build.js               # Build-Script
├── package.json           # NPM-Konfiguration
├── netlify.toml          # Netlify-Konfiguration
├── .gitignore
├── .env.example          # Environment Variables Template
└── README.md             # Diese Datei
```

## 🔐 Environment Variables

### Pflicht-Variablen

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `SUPABASE_URL` | Supabase Projekt-URL | `https://abc123.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Public Key | `eyJhbGciOiJIUz...` |

### Optionale Variablen

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `STRIPE_PUBLISHABLE_KEY` | Stripe Public Key | `pk_test_51...` |
| `STRIPE_PRICE_BASIC` | Stripe Price ID für Basis | `price_1Q...` |
| `STRIPE_PRICE_PREMIUM` | Stripe Price ID für Premium | `price_1Q...` |
| `STRIPE_PRICE_ELITE` | Stripe Price ID für Elite | `price_1Q...` |

## 📊 Supabase Setup

### Database Schema

Die folgenden Tabellen müssen in Supabase erstellt werden:

```sql
-- Subscriptions Tabelle
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'premium', 'elite')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  pending_plan TEXT CHECK (pending_plan IN ('basic', 'premium', 'elite')),
  pending_change_date TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für schnellere Abfragen
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- RLS (Row Level Security) Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- User können nur ihre eigenen Subscriptions sehen
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- User können ihre eigenen Subscriptions updaten
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);
```

### Storage Buckets

Erstelle folgende Storage Buckets in Supabase:

- `videos` - Für Trainingsvideos
- `documents` - Für PDFs und Guides
- `images` - Für Bilder und Thumbnails

## 🎨 Customization

### Farben ändern

Bearbeite `styles.css` und ändere die CSS-Variablen:

```css
:root {
  --primary: #2563eb;      /* Hauptfarbe */
  --secondary: #8b5cf6;    /* Sekundärfarbe */
  --success: #10b981;      /* Erfolg */
  --danger: #ef4444;       /* Fehler */
}
```

### Pläne anpassen

Bearbeite `app.js` und ändere die `planPrices` und `planNames`:

```javascript
const planPrices = {
  basic: 29,
  premium: 59,
  elite: 99,
};

const planNames = {
  basic: "Basis",
  premium: "Premium",
  elite: "Elite",
};
```

## 🐛 Debugging

### Build-Logs checken

```bash
# Lokaler Build mit Debug-Output
node build.js
```

### Netlify Build-Logs

1. Gehe zu: Deploys → [Latest Deploy] → Deploy log
2. Suche nach Fehlern oder Warnungen
3. Überprüfe, ob Environment Variables gesetzt sind

### Browser Console

Öffne die Browser-Konsole (F12) und suche nach:
- Supabase Initialisierungsfehler
- Stripe Fehler
- Network Errors (401, 403, 404)

## 📝 To-Do Liste

- [ ] E-Mail-Vorlagen mit Resend erstellen
- [ ] Success.html Seite erstellen
- [ ] Webhook für Stripe Payments einrichten
- [ ] Automated Testing hinzufügen
- [ ] Admin-Dashboard erstellen
- [ ] Analytics (Google Analytics / Plausible) integrieren

## 🤝 Support

Bei Problemen:

1. **Check die FAQs** in diesem README
2. **Öffne ein Issue** auf GitHub
3. **Kontakt**: support@coachflow.de

## 📄 License

MIT License - siehe [LICENSE](LICENSE) für Details

## 🙏 Credits

- **Supabase** - Backend & Auth
- **Stripe** - Payment Processing
- **Netlify** - Hosting
- **Resend** - Email Service

---

**Entwickelt mit ❤️ für die Fitness-Community**
