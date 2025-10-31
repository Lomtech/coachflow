
# CoachFlow - Multi-Tenant Coach Platform

## 📋 Übersicht

CoachFlow Phase 1 ist jetzt eine vollständige Multi-Tenant-Plattform, auf der Coaches:
- Sich registrieren und einloggen können
- Eigene Membership-Pakete erstellen und verwalten
- Content (Dokumente, Bilder) hochladen
- Ihre Mitglieder verwalten
- Ihre eigene Landing Page haben

## 🚀 Neue Dateien & Struktur

### Coach-Bereich
```
coach-register.html       - Coach-Registrierung
coach-login.html          - Coach-Login
coach-dashboard.html      - Haupt-Dashboard
coach-dashboard.css       - Dashboard-Styling
coach-dashboard.js        - Dashboard-Funktionalität
coach-auth.js            - Authentifizierung
```

### Datenbank
```
database/
  ├── schema.sql          - Vollständiges DB-Schema
  └── README.md           - Setup-Anleitung
```

### Landing Page Extension
```
app-dynamic-coach.js     - Dynamische Coach-Erkennung & Package-Loading
```

## 📊 Datenbank-Schema

### Tabellen
1. **coaches** - Coach-Profile und Business-Informationen
2. **packages** - Von Coaches erstellte Membership-Pakete
3. **content** - Hochgeladene Inhalte (Videos, Dokumente, Bilder, Text)
4. **subscriptions** - Mitglieder-Abonnements
5. **profiles** - User-Profile mit Rollen

### Storage Buckets
- **coach-logos** - Coach-Logos (öffentlich)
- **content-files** - Content-Dateien (privat, nur für Mitglieder)

## 🎯 Funktionen Phase 1

### ✅ Implementiert

#### Coach-Registrierung & Login
- Vollständige Authentifizierung über Supabase Auth
- Automatische Coach-Profil-Erstellung
- Slug-basierte URLs

#### Coach-Dashboard
- **Übersicht**: Statistiken (Mitglieder, Umsatz, Pakete)
- **Pakete**: Erstellen, Bearbeiten, Löschen von Membership-Paketen
- **Content**: Upload von Dokumenten und Bildern
- **Mitglieder**: Übersicht aller Abonnenten
- **Einstellungen**: Profil bearbeiten, Stripe Connect Status

#### Dynamische Landing Pages
- URL-Parameter: `?coach=slug`
- Zeigt Coach-spezifische Pakete
- Angepasstes Branding
- Automatische Content-Anzeige für Mitglieder

#### Content-Upload
- Dokumente (.pdf, .doc, .docx)
- Bilder (alle Formate)
- Text-Content
- Automatische Speicherung in Supabase Storage

#### Sicherheit
- Row Level Security (RLS) auf allen Tabellen
- Coaches sehen nur eigene Daten
- Mitglieder sehen nur Content ihrer Abonnements

## 📝 Setup-Anleitung

### 1. Datenbank einrichten

```bash
# In Supabase Dashboard:
1. Gehe zu SQL Editor
2. Kopiere Inhalt von database/schema.sql
3. Führe das Script aus
```

### 2. Storage Buckets erstellen

Die Buckets werden automatisch vom Schema erstellt:
- `coach-logos`
- `content-files`

### 3. Environment Variables (Netlify)

Alle bestehenden Variables werden weiterhin benötigt:
```
SUPABASE_URL
SUPABASE_ANON_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_PRICE_BASIC
STRIPE_PRICE_PREMIUM
STRIPE_PRICE_ELITE
```

### 4. Build & Deploy

```bash
npm run build
# Deploy to Netlify as usual
```

## 🎨 Nutzung

### Als Coach

1. **Registrierung**: Gehe zu `/coach-register.html`
   - Name, E-Mail, Passwort
   - Business Name
   - URL-Slug (z.B. "mein-coaching")

2. **Pakete erstellen**: Im Dashboard → Pakete
   - Name, Beschreibung, Preis
   - Features auflisten
   - Monatlich oder jährlich

3. **Content hochladen**: Dashboard → Content
   - Paket auswählen
   - Typ wählen (Bild/Dokument)
   - Datei hochladen

4. **Landing Page teilen**:
   ```
   https://deine-domain.com/?coach=mein-slug
   ```

### Als Mitglied

1. Besuche Coach-Landing Page: `/?coach=coach-slug`
2. Wähle Paket aus
3. Registriere dich (falls nötig)
4. Nach Zahlung: Zugriff auf Content

## 🔄 Workflow

```
1. Coach registriert sich
   ↓
2. Coach erstellt Pakete
   ↓
3. Coach lädt Content hoch
   ↓
4. Coach teilt Landing Page-URL
   ↓
5. Mitglieder abonnieren Pakete
   ↓
6. Mitglieder sehen Coach-spezifischen Content
```

## 🎯 Nächste Schritte (Phase 2+)

### Phase 2 - Video & Text
- [ ] Video-Upload zu Cloudflare Stream
- [ ] Rich-Text-Editor für Text-Content
- [ ] Video-Player im Members-Bereich

### Phase 3 - Subdomain-Routing
- [ ] Echte Subdomains (coach1.coachflow.com)
- [ ] Custom Domains für Coaches
- [ ] DNS-Integration

### Phase 4 - Erweiterte Features
- [ ] Erweiterte Statistiken & Analytics
- [ ] Umsatz-Tracking
- [ ] E-Mail-Benachrichtigungen
- [ ] Automated Onboarding-Flows

### Stripe Connect Integration
- [ ] Stripe Connect Onboarding-Flow
- [ ] Checkout-Session-Creation (Backend)
- [ ] Webhook-Handling
- [ ] Payout-Management

## 🔐 Sicherheit

### Row Level Security (RLS)
Alle Tabellen haben RLS aktiviert:
- Coaches können nur eigene Daten sehen/bearbeiten
- Mitglieder können nur Content ihrer Abonnements sehen
- Öffentliche Landing Pages zeigen nur aktive Pakete

### Storage Policies
- Coach-Logos: Öffentlich lesbar, nur Coach kann hochladen
- Content-Files: Privat, nur für Mitglieder mit aktivem Abo

## 🐛 Debugging

### Debug-Logs aktivieren
In allen JavaScript-Dateien ist `DEBUG = true` gesetzt.
Öffne Browser-Konsole (F12) für detaillierte Logs.

### Häufige Probleme

1. **Coach kann sich nicht registrieren**
   - Prüfe: Ist das Schema ausgeführt?
   - Prüfe: Ist Supabase Auth aktiviert?

2. **Content wird nicht angezeigt**
   - Prüfe: Sind Storage Buckets erstellt?
   - Prüfe: Sind Storage Policies korrekt?

3. **Pakete werden nicht geladen**
   - Prüfe: Hat Coach Pakete erstellt?
   - Prüfe: Sind Pakete auf `is_active = true`?

## 📚 Dokumentation

- **Datenbank**: Siehe `database/README.md`
- **Stripe Connect**: Siehe `STRIPE_CONNECT.md` (wird noch erstellt)

## 🤝 Support

Bei Fragen oder Problemen:
1. Prüfe Browser-Konsole für Fehlermeldungen
2. Prüfe Supabase Dashboard → Logs
3. Prüfe Database → SQL Editor für Schema-Probleme

## 📊 Statistiken

### Dashboard-Metriken
- **Mitglieder**: Gesamt und aktive Abos
- **Pakete**: Anzahl erstellter Pakete
- **Monatlicher Umsatz**: Summe aller aktiven Abos
- **Paket-Statistiken**: Abonnenten pro Paket

### Views
Das Schema erstellt automatisch Views für Statistiken:
- `coach_dashboard_stats`
- `package_stats`

## 🎨 Customization

### Branding anpassen
Coaches können im Dashboard ihr Profil anpassen:
- Business Name
- Beschreibung
- (Logo-Upload folgt in Phase 2)

### Landing Page
Wird automatisch mit Coach-Daten personalisiert:
- Coach-Name im Header
- Beschreibung im Hero
- Coach-spezifische Pakete

## ✨ Features im Detail

### Content-Upload
- **Unterstützte Formate**:
  - Bilder: .jpg, .png, .gif, .webp
  - Dokumente: .pdf, .doc, .docx, .txt
  - Videos: (Phase 2)
  
- **Maximale Dateigröße**: 10 MB
- **Storage**: Supabase Storage
- **Zugriff**: Nur für Mitglieder mit aktivem Abo

### Package Management
- Unbegrenzte Anzahl an Paketen
- Flexible Preisgestaltung
- Monatliche oder jährliche Abrechnung
- Feature-Listen pro Paket
- Ein/Ausschalten von Paketen

---

**Version**: Phase 1 - November 2025  
**Status**: ✅ Core Features implementiert, bereit für Testing
