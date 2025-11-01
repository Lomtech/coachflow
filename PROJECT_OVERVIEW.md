# 📋 CoachFlow - Projekt-Übersicht

## 🎯 Projektbeschreibung

CoachFlow ist eine vollständige SaaS-Plattform für Fitness- und Yoga-Coaches, die eigene Membership-Websites erstellen und betreiben möchten.

## 💼 Geschäftsmodell

### Einnahmequellen

1. **Coaches zahlen Plattformgebühr**:
   - Basic: 49€/Monat
   - Premium: 199€/Monat
   - Elite: 399€/Monat

2. **Kunden zahlen direkt an Coaches**:
   - Via Stripe Connect
   - Plattform erhält Application Fee (5-10%)
   - Geld geht direkt auf Coach-Girokonto

## 🏗️ Architektur

### Frontend
- **Technologie**: Vanilla JavaScript, HTML5, CSS3
- **Kein Build-Prozess**: Direct Deployment
- **Responsive**: Mobile-First Design
- **Performance**: Optimiert für schnelle Ladezeiten

### Backend
- **Netlify Serverless Functions**: Node.js
- **6 Functions**:
  1. `create-coach-checkout.js` - Coach-Registrierung
  2. `stripe-webhook.js` - Webhook-Handler
  3. `create-connect-account.js` - Stripe Connect
  4. `create-customer-checkout.js` - Kunden-Zahlung
  5. `create-tier-price.js` - Tier-Erstellung
  6. `upload-content.js` - Content-Metadata

### Datenbank
- **Supabase PostgreSQL**
- **4 Haupttabellen**:
  1. `coaches` - Coach-Daten
  2. `tiers` - Membership-Tiers
  3. `content` - Hochgeladene Inhalte
  4. `customers` - Kunden/Mitglieder

### Storage
- **Supabase Storage**
- **3 Buckets**:
  1. `videos` - Video-Inhalte
  2. `documents` - PDF-Dokumente
  3. `images` - Bilder

### Zahlungen
- **Stripe Checkout**: Payment Processing
- **Stripe Connect Express**: Coach-Auszahlungen
- **Subscription Management**: Automatische Verlängerungen

### E-Mail
- **Resend.com**: Transaktionale E-Mails
- **Onboarding-E-Mails**: Nach Coach-Registrierung
- **Template-System**: HTML-E-Mails

## 📄 Seitenstruktur

### 1. Landing Page (`index.html`)
- Hero-Section mit Value Proposition
- Features-Übersicht (6 Hauptfeatures)
- Pricing-Section mit 3 Plänen
- Inline-Formulare für Registrierung
- Stripe Checkout Integration
- Footer mit Links zu Rechtstexten

### 2. Coach Dashboard (`dashboard.html`)
**Funktionen**:
- Authentifizierung (Supabase Auth)
- Statistiken-Übersicht
- Stripe Connect Integration
- Tier-Konfigurator
- Content-Upload-System
- Content-Verwaltung
- Membership-Link Generator

**Sections**:
- Welcome & Status Cards
- Stripe Connect Status
- Tier Configuration Form
- Upload Form with Progress
- Content List
- Membership Link Display

### 3. Kunden-Portal (`member-portal.html`)
**Funktionen**:
- Coach-spezifische Ansicht (via URL-Parameter)
- Tier-Informationen anzeigen
- Login/Registrierung für Kunden
- Stripe Checkout für Mitgliedschaft
- Content-Zugriff nach Zahlung
- Tab-Navigation (Videos/Dokumente/Bilder)

**Features**:
- Video-Player Modal
- PDF-Viewer Integration
- Bild-Galerie
- Subscription-Management

### 4. Login Page (`login.html`)
- Einfache Login-Form
- E-Mail & Passwort
- Coach-Validierung
- Redirect zu Dashboard

### 5. Rechtstexte
- **AGB** (`agb.html`) - Allgemeine Geschäftsbedingungen
- **Datenschutz** (`datenschutz.html`) - DSGVO-konform
- **Impressum** (`impressum.html`) - Pflichtangaben

## 🗂️ Dateistruktur

```
coachflow/
├── 📄 Frontend
│   ├── index.html              # Landing Page
│   ├── landing.js              # Landing Page Logic
│   ├── dashboard.html          # Coach Dashboard
│   ├── dashboard.js            # Dashboard Logic
│   ├── member-portal.html      # Kunden-Portal
│   ├── member-portal.js        # Portal Logic
│   ├── login.html              # Coach Login
│   ├── styles.css              # Global Styles
│   ├── agb.html                # AGB
│   ├── datenschutz.html        # Datenschutz
│   └── impressum.html          # Impressum
│
├── ⚙️ Backend
│   └── netlify/functions/
│       ├── create-coach-checkout.js
│       ├── stripe-webhook.js
│       ├── create-connect-account.js
│       ├── create-customer-checkout.js
│       ├── create-tier-price.js
│       └── upload-content.js
│
├── 🗄️ Datenbank
│   └── supabase/
│       └── schema.sql          # Datenbank-Schema
│
├── 📦 Konfiguration
│   ├── netlify.toml            # Netlify Config
│   ├── package.json            # NPM Dependencies
│   ├── .env.example            # Environment Variables
│   └── .gitignore              # Git Ignore
│
└── 📖 Dokumentation
    ├── README.md               # Hauptdokumentation
    ├── QUICKSTART.md           # Quick Start Guide
    └── PROJECT_OVERVIEW.md     # Diese Datei
```

## 🔑 Hauptfeatures

### Für Plattform-Betreiber
✅ SaaS-Modell mit wiederkehrenden Einnahmen
✅ 3 Pricing-Tiers für Coaches
✅ Automatische Zahlungsabwicklung
✅ Webhook-basierte Coach-Erstellung
✅ E-Mail-Onboarding-System
✅ Skalierbare Infrastruktur

### Für Coaches
✅ 1 konfigurierbares Membership-Tier
✅ Unbegrenzter Content-Upload (Videos, PDFs, Bilder)
✅ Stripe Connect Integration (Direkt-Auszahlung)
✅ Teilbarer Membership-Link
✅ Dashboard mit Statistiken
✅ Mitgliederverwaltung

### Für Kunden (Mitglieder)
✅ Einfache Registrierung
✅ Sichere Zahlung via Stripe
✅ Sofortiger Content-Zugriff
✅ Video-Streaming
✅ PDF-Dokumente
✅ Bild-Galerie

## 🔐 Sicherheit

### Implementiert
- ✅ Row Level Security (RLS) in Supabase
- ✅ API Keys nur in Backend (Netlify Functions)
- ✅ Stripe Webhook Signature Verification
- ✅ HTTPS-Only (Netlify)
- ✅ CORS-Konfiguration
- ✅ Passwort-Hashing (Supabase Auth)

### Best Practices
- ✅ Service Key nie im Frontend
- ✅ Environment Variables für Secrets
- ✅ Input Validation
- ✅ XSS Protection Headers
- ✅ CSRF Protection (Stripe Checkout)

## 📊 Datenbank-Schema

### Coaches Table
```sql
coaches (
  id UUID PRIMARY KEY,
  email TEXT,
  name TEXT,
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  stripe_account_onboarded BOOLEAN,
  plan TEXT,
  subscription_id TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Tiers Table
```sql
tiers (
  id UUID PRIMARY KEY,
  coach_id UUID,
  name TEXT,
  price INTEGER,
  description TEXT,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(coach_id) -- 1 Tier pro Coach
)
```

### Content Table
```sql
content (
  id UUID PRIMARY KEY,
  coach_id UUID,
  tier_id UUID,
  title TEXT,
  file_url TEXT,
  file_type TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Customers Table
```sql
customers (
  id UUID PRIMARY KEY,
  user_id UUID,
  coach_id UUID,
  tier_id UUID,
  email TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, coach_id)
)
```

## 🔄 User Flows

### Flow 1: Coach Onboarding
1. Besucht Landing Page
2. Wählt Plan (Basic/Premium/Elite)
3. Füllt Formular aus (Name, E-Mail)
4. Stripe Checkout → Zahlung
5. Webhook erstellt Coach-Account + Stripe Connect Account
6. E-Mail mit Dashboard-Link + Connect-Onboarding-Link
7. Coach verbindet Girokonto
8. Coach erstellt Tier
9. Coach lädt Inhalte hoch
10. Coach teilt Membership-Link

### Flow 2: Kunde wird Mitglied
1. Klickt auf Membership-Link
2. Sieht Tier-Informationen
3. Registriert sich (E-Mail, Passwort)
4. Stripe Checkout → Zahlung an Coach
5. Nach erfolgreicher Zahlung → Zugriff auf Inhalte
6. Kann Videos ansehen, PDFs lesen, Bilder anzeigen

### Flow 3: Subscription Management
1. Kunde loggt sich im Portal ein
2. Sieht Subscription-Status
3. Kann kündigen (über Stripe Customer Portal)
4. Webhook aktualisiert Status in DB

## 🧪 Testing

### Stripe Test-Daten
- **Testkarte**: 4242 4242 4242 4242
- **CVV**: Beliebig (z.B. 123)
- **Datum**: Zukunft (z.B. 12/30)
- **Test-Mode**: Automatisch im Test-Mode

### Test-Szenarien
1. ✅ Coach-Registrierung (alle 3 Pläne)
2. ✅ Stripe Connect Onboarding
3. ✅ Tier-Erstellung
4. ✅ Content-Upload (Video, PDF, Bild)
5. ✅ Kunden-Registrierung
6. ✅ Kunden-Zahlung
7. ✅ Content-Zugriff nach Zahlung
8. ✅ Video-Playback
9. ✅ Subscription-Kündigung
10. ✅ Webhook-Events

## 📈 Metriken & Analytics

### Coach Dashboard Metriken
- Aktive Mitglieder
- Hochgeladene Inhalte
- Aktueller Plan
- Stripe Connect Status

### Mögliche Erweiterungen
- Umsatz-Tracking
- Conversion Rates
- Churn Analysis
- Content-Views
- Popular Content

## 🚀 Deployment

### Requirements
- Netlify Account
- Stripe Account
- Supabase Project
- Resend Account

### Environment Variables (11 total)
```
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_BASIC
STRIPE_PRICE_PREMIUM
STRIPE_PRICE_ELITE
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
RESEND_API_KEY
URL (auto-set by Netlify)
```

### Deployment-Optionen
1. **GitHub → Netlify**: Automatisches Deployment bei Push
2. **Netlify CLI**: Manuelles Deployment via CLI
3. **Netlify Drop**: Drag & Drop Deployment

## 🔮 Roadmap v2.0

### Geplante Features
- [ ] Multiple Tiers pro Coach
- [ ] Live-Streaming Integration
- [ ] Community/Forum
- [ ] Analytics Dashboard
- [ ] Affiliate-Programm
- [ ] Mobile Apps
- [ ] API für Integrationen
- [ ] White-Label Option
- [ ] Custom Domains pro Coach
- [ ] Advanced Subscription Management

### Optimierungen
- [ ] CDN für Video-Streaming
- [ ] Image Optimization
- [ ] PWA Support
- [ ] SEO Optimization
- [ ] Performance Monitoring
- [ ] Error Tracking (Sentry)
- [ ] A/B Testing
- [ ] Multi-Language Support

## 📞 Support & Kontakt

- **E-Mail**: support@coachflow.de
- **GitHub**: [Repository-Link]
- **Dokumentation**: README.md

## 📄 Lizenz

MIT License

---

**Entwickelt mit ❤️ für Coaches weltweit**
