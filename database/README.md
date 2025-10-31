# CoachFlow Database Setup

## Installation

### Option 1: Supabase Dashboard (Empfohlen)

1. Gehe zu deinem Supabase Dashboard
2. Klicke auf **SQL Editor**
3. Erstelle eine neue Query
4. Kopiere den Inhalt von `schema.sql` und führe ihn aus

### Option 2: Supabase CLI

```bash
# Schema ausführen
supabase db reset
# oder
psql -h your-project.supabase.co -U postgres -d postgres -f database/schema.sql
```

## Tabellen-Übersicht

### `coaches`
Speichert alle registrierten Coaches mit ihren Business-Informationen und Stripe Connect Details.

### `packages`
Von Coaches erstellte Membership-Pakete mit Preisen und Features.

### `content`
Alle hochgeladenen Inhalte (Videos, Dokumente, Bilder, Text) zugeordnet zu Paketen.

### `subscriptions`
Mitglieder-Abonnements mit Verknüpfung zu Coach und Paket.

### `profiles`
User-Profile mit Rollen (member, coach, admin).

## Storage Buckets

- **coach-logos**: Öffentliche Logos der Coaches
- **content-files**: Private Content-Dateien (nur für Mitglieder mit aktivem Abo)

## Security

Das Schema nutzt Row Level Security (RLS) für alle Tabellen:
- Coaches können nur ihre eigenen Daten sehen und bearbeiten
- Mitglieder können nur Content ihrer aktiven Subscriptions sehen
- Öffentliche Landing Pages können aktive Pakete sehen

## Views

- **coach_dashboard_stats**: Statistiken für Coach Dashboard
- **package_stats**: Statistiken pro Paket

## Nächste Schritte

Nach dem Ausführen des Schemas:
1. Erstelle die Storage Buckets in Supabase (falls noch nicht vorhanden)
2. Teste die RLS Policies
3. Erstelle einen Test-Coach Account
