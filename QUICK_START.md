# 🚀 Quick Start Guide - CoachFlow Phase 1

## ✅ Was wurde implementiert?

Phase 1 der Multi-Tenant Coach-Plattform ist fertig! Coaches können jetzt:

✅ Sich registrieren und einloggen  
✅ Eigene Membership-Pakete erstellen  
✅ Content (Dokumente & Bilder) hochladen  
✅ Ihre Mitglieder verwalten  
✅ Eigene Landing Page mit eigenem URL-Slug haben  
✅ Dashboard mit Statistiken nutzen  

## 📋 Sofort loslegen - 3 Schritte

### Schritt 1: Datenbank Setup (5 Minuten)

1. Öffne dein **Supabase Dashboard**
2. Gehe zu **SQL Editor**
3. Öffne die Datei `database/schema.sql`
4. Kopiere den kompletten Inhalt
5. Füge ihn in den SQL Editor ein
6. Klicke auf **Run**

✅ Done! Alle Tabellen, Views, Storage Buckets und RLS Policies sind jetzt erstellt.

### Schritt 2: Build & Deploy (2 Minuten)

```bash
# Im Projektverzeichnis
npm run build

# Dann auf Netlify pushen (oder manuell deployen)
git add .
git commit -m "Add coach platform Phase 1"
git push
```

Netlify erkennt automatisch die Änderungen und deployed.

### Schritt 3: Ersten Coach erstellen (3 Minuten)

1. Gehe zu: `https://deine-domain.com/coach-register.html`
2. Fülle das Formular aus:
   - Name: z.B. "Max Mustermann"
   - E-Mail: deine@email.com
   - Passwort: mindestens 6 Zeichen
   - Business Name: z.B. "Max Fitness Studio"
   - URL-Slug: z.B. "max-fitness" (wird Teil der URL)
3. Klicke auf **Registrieren**

✅ Du wirst automatisch zum Dashboard weitergeleitet!

## 🎯 Coach Workflow

### 1. Erstes Paket erstellen

Im Dashboard → **Pakete** → **+ Neues Paket**

```
Name: Basic Training
Beschreibung: Grundlegendes Fitness-Programm
Preis: 29
Intervall: Monatlich
Features: (eines pro Zeile)
  - 3 Workouts pro Woche
  - Trainingsplan
  - E-Mail Support
```

Klicke **Speichern** ✅

### 2. Content hochladen

Dashboard → **Content** → **+ Content hochladen**

```
Paket: Basic Training (auswählen)
Content-Typ: Dokument / Bild
Titel: Trainingsplan Woche 1
Beschreibung: Dein Start in die Fitness
Datei: (PDF oder Bild hochladen)
```

Klicke **Hochladen** ✅

### 3. Landing Page teilen

Im Dashboard → **Einstellungen** findest du deine Landing Page URL:

```
https://deine-domain.com/?coach=max-fitness
```

Diese URL kannst du jetzt teilen! 🎉

## 🔗 Wichtige URLs

### Coach-Bereich
- Registrierung: `/coach-register.html`
- Login: `/coach-login.html`
- Dashboard: `/coach-dashboard.html`

### Landing Pages
- Allgemein: `/`
- Coach-spezifisch: `/?coach=SLUG`

## 🧪 Testen

### Test-Workflow für einen Coach

```bash
1. ✅ Coach registrieren       → /coach-register.html
2. ✅ Ins Dashboard gehen      → automatisch
3. ✅ Paket erstellen          → Dashboard → Pakete
4. ✅ Content hochladen        → Dashboard → Content
5. ✅ Landing Page ansehen     → Klick auf "Landing Page ansehen"
6. ✅ Als Mitglied registrieren → Auf Landing Page Paket wählen
7. ✅ Content im Members-Bereich sehen
```

### Debug-Modus

Alle Scripts haben Debug-Logging aktiviert:
- Öffne Browser-Konsole (F12)
- Alle Aktionen werden geloggt mit `[COACH]`, `[DASHBOARD]`, etc.

## 📁 Neue Dateien-Übersicht

```
coachflow/
├── coach-register.html           # Coach-Registrierung
├── coach-login.html              # Coach-Login
├── coach-dashboard.html          # Dashboard
├── coach-dashboard.js            # Dashboard-Logik
├── coach-dashboard.css           # Dashboard-Styling
├── coach-auth.js                 # Authentifizierung
├── app-dynamic-coach.js          # Landing Page Extension
├── database/
│   ├── schema.sql               # Komplettes DB-Schema
│   └── README.md                # DB-Setup Anleitung
├── COACH_PLATFORM_README.md     # Vollständige Dokumentation
├── STRIPE_CONNECT.md            # Stripe-Integration Anleitung
└── QUICK_START.md               # Diese Datei
```

## 🎨 Anpassungen

### Branding ändern

Coaches können im Dashboard → **Einstellungen**:
- Name ändern
- Business Name ändern
- Beschreibung ändern

Diese Änderungen erscheinen automatisch auf der Landing Page.

### Pakete anpassen

Dashboard → **Pakete** → Auf **Bearbeiten** klicken
- Preis ändern
- Features hinzufügen/entfernen
- Beschreibung aktualisieren

## 🔐 Sicherheit

### Was ist gesichert?

✅ **Row Level Security (RLS)** auf allen Tabellen  
✅ Coaches sehen nur eigene Daten  
✅ Mitglieder sehen nur Content ihrer Abos  
✅ File-Upload ist auf 10 MB begrenzt  
✅ Storage-Policies schützen Content  

### Was noch kommt?

In Phase 2:
- Stripe Connect für Zahlungen
- Video-Upload zu Cloudflare
- E-Mail-Benachrichtigungen

## 🐛 Problembehandlung

### Problem: "Page not found" nach Registrierung

**Lösung**: Prüfe, ob `coach-dashboard.html` im `dist/` Ordner ist.

```bash
npm run build
```

### Problem: Content wird nicht hochgeladen

**Lösung**: Prüfe Storage Buckets in Supabase:

1. Gehe zu Supabase → Storage
2. Prüfe ob `content-files` Bucket existiert
3. Falls nicht: Führe `database/schema.sql` erneut aus

### Problem: Pakete werden auf Landing Page nicht angezeigt

**Lösung**:
1. Prüfe in Browser-Konsole nach Fehler
2. Stelle sicher, dass Paket `is_active = true` ist
3. Prüfe ob Coach-Slug korrekt in URL ist: `?coach=RICHTIGER-SLUG`

## 📊 Dashboard-Features

### Übersicht-Tab
- **Statistik-Karten**: Mitglieder, Aktive Abos, Pakete, Umsatz
- **Schnellaktionen**: Direktlinks zu wichtigen Funktionen
- **Paket-Statistiken**: Tabelle mit Abonnenten pro Paket

### Pakete-Tab
- Erstellen, Bearbeiten, Löschen
- Features verwalten
- Preise anpassen
- Aktivieren/Deaktivieren

### Content-Tab
- Upload von Dokumenten und Bildern
- Zuordnung zu Paketen
- Filter nach Paket und Typ
- Vorschau und Verwaltung

### Mitglieder-Tab
- Liste aller Abonnenten
- Status (active, canceled, etc.)
- Zugeordnetes Paket
- Anmeldedatum

### Einstellungen-Tab
- Profil bearbeiten
- Landing Page URL
- Stripe Connect Status (vorbereitet)

## 🚀 Nächste Schritte

Nach dem Testing von Phase 1:

### Phase 2 - Video & Text
- Video-Upload zu Cloudflare Stream
- Rich-Text-Editor für Text-Content
- Video-Player im Members-Bereich

### Phase 3 - Subdomains
- Echte Subdomains (coach1.coachflow.com)
- Custom Domains
- DNS-Integration

### Phase 4 - Advanced Features
- Erweiterte Analytics
- E-Mail-Benachrichtigungen
- Automated Workflows

## 💡 Tipps

### Für Coaches
1. Erstelle zuerst 2-3 Pakete (z.B. Basic, Premium, Elite)
2. Lade für jedes Paket mindestens 3-5 Content-Pieces hoch
3. Teste die Landing Page, bevor du sie teilst
4. Nutze aussagekräftige Paket-Namen und Beschreibungen

### Für Entwickler
1. Aktiviere Debug-Logs in Browser-Konsole
2. Prüfe Supabase Dashboard → Logs bei Problemen
3. Teste RLS Policies mit verschiedenen User-Rollen
4. Nutze Supabase SQL Editor für Datenbank-Abfragen

## 📞 Support

Bei Fragen:
1. Prüfe `COACH_PLATFORM_README.md` für Details
2. Prüfe Browser-Konsole für Fehlermeldungen
3. Prüfe Supabase Dashboard → Logs

## 🎉 Fertig!

Du hast jetzt eine vollständige Multi-Tenant Coach-Plattform!

**Was funktioniert:**
✅ Coach-Registrierung & Login  
✅ Dashboard mit Statistiken  
✅ Paket-Management  
✅ Content-Upload (Dokumente & Bilder)  
✅ Mitglieder-Verwaltung  
✅ Dynamische Landing Pages  
✅ Sichere Datenbank mit RLS  

**Bereit für:**
🔄 Testing und Feedback  
🚀 Produktions-Deployment  
📈 Phase 2 Features  

---

**Viel Erfolg mit CoachFlow! 🏋️** 

Bei Fragen: Öffne ein Issue oder kontaktiere den Support.
