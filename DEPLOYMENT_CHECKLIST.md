# ✅ Netlify Deployment Checklist

## 🎯 Ziel
Deine CoachFlow-Seite auf https://coachflow1.netlify.app/ funktionsfähig machen

---

## 📝 Schritt-für-Schritt Anleitung

### ✅ Schritt 1: Dateien zu GitHub/Netlify hochladen

**Option A: Über GitHub (empfohlen)**

```bash
# 1. Erstelle ein neues Repository auf GitHub
# Gehe zu: https://github.com/new

# 2. Lokales Repository verbinden (ersetze USERNAME/REPO mit deinen Werten)
git remote add origin https://github.com/USERNAME/coachflow.git
git branch -M main
git push -u origin main

# 3. In Netlify: Verbinde das GitHub Repository
# Site Settings → Build & deploy → Link repository
```

**Option B: Direkter Upload zu Netlify**

1. Packe alle Dateien in ein ZIP-Archiv (außer `node_modules/` und `dist/`)
2. Gehe zu: https://app.netlify.com
3. Drag & Drop das ZIP auf "Sites"

---

### ✅ Schritt 2: Build-Einstellungen in Netlify prüfen

Gehe zu: **Site Settings → Build & deploy → Build settings**

Stelle sicher, dass folgende Werte gesetzt sind:

| Einstellung | Wert |
|-------------|------|
| **Build command** | `node build.js` |
| **Publish directory** | `dist` |
| **Node version** | `18.x` oder höher |

Falls nicht gesetzt:
1. Klicke auf **Edit settings**
2. Setze die Werte wie oben
3. Klicke auf **Save**

---

### ✅ Schritt 3: Environment Variables setzen

**KRITISCH:** Ohne diese Variablen funktioniert die Seite nicht richtig!

#### 3.1 Supabase Credentials holen

1. Gehe zu: https://app.supabase.com
2. Wähle dein Projekt aus (falls du mehrere hast)
3. Klicke auf **Settings** (⚙️ unten links)
4. Klicke auf **API**
5. Kopiere:
   - **Project URL** (z.B. `https://ftohghotvfgkoeclmwfv.supabase.co`)
   - **anon public** key (der lange String unter "Project API keys")

#### 3.2 Variables in Netlify setzen

1. Gehe zu: **Site Settings → Build & deploy → Environment → Environment variables**
2. Klicke auf **Add a variable**
3. Füge diese Variablen hinzu:

| Key (exakt!) | Value (Beispiel) | Pflicht |
|--------------|------------------|---------|
| `SUPABASE_URL` | `https://ftohghotvfgkoeclmwfv.supabase.co` | ✅ JA |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ JA |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_51...` | ⚠️ Optional |

**Wichtige Hinweise:**
- ✅ Groß-/Kleinschreibung beachten!
- ✅ Keine Leerzeichen am Anfang/Ende
- ✅ Keine Anführungszeichen hinzufügen
- ⚠️ Ohne Stripe läuft die Seite im Demo-Modus (OK für Testing!)

#### 3.3 Screenshot zur Kontrolle

Deine Environment Variables sollten so aussehen:

```
Environment variables (3)
┌──────────────────────────────┬──────────────────────────────┐
│ Key                          │ Value                         │
├──────────────────────────────┼──────────────────────────────┤
│ SUPABASE_URL                 │ https://ftohgho...           │
│ SUPABASE_ANON_KEY            │ eyJhbGciOiJI...              │
│ STRIPE_PUBLISHABLE_KEY       │ pk_test_51...                │
└──────────────────────────────┴──────────────────────────────┘
```

---

### ✅ Schritt 4: Rebuild triggern

1. Gehe zu: **Deploys** (oben)
2. Klicke auf **Trigger deploy** → **Deploy site**
3. Warte 1-2 Minuten

---

### ✅ Schritt 5: Build-Log überprüfen

1. Klicke auf den neuesten Deploy
2. Klicke auf **Deploy log**
3. Scrolle nach unten und suche nach:

```
✅ SUPABASE_URL: https://ftohghotvfgkoeclmwfv...
✅ SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIs...
✅ Build erfolgreich abgeschlossen!
```

**Falls du siehst:**
```
❌ SUPABASE_URL: nicht gesetzt
❌ SUPABASE_ANON_KEY: nicht gesetzt
```

→ Gehe zurück zu Schritt 3 und überprüfe die Variablen!

---

### ✅ Schritt 6: Seite testen

1. Öffne: https://coachflow1.netlify.app/
2. Die Seite sollte laden! 🎉

**Teste folgendes:**
- [ ] Hauptseite lädt (keine 404 mehr)
- [ ] Navigation funktioniert
- [ ] Login/Registrierung öffnet Modal
- [ ] Keine roten Fehler in Browser-Console (F12)

**Erwartete Fehler (normal):**
- ⚠️ Stripe-Warnungen (falls nicht konfiguriert) → Demo-Modus aktiv
- ⚠️ Supabase-Fehler beim Login (falls Supabase noch nicht eingerichtet)

---

## 🔍 Troubleshooting

### Problem 1: Immer noch 404

**Ursache:** Build schlägt fehl oder Publish Directory falsch

**Lösung:**
1. Überprüfe Build Command: `node build.js`
2. Überprüfe Publish Directory: `dist`
3. Check Deploy Log auf Fehler
4. Stelle sicher dass `dist/` Ordner erstellt wurde

### Problem 2: "DEIN_SUPABASE_URL" wird angezeigt

**Ursache:** Environment Variables nicht korrekt gesetzt

**Lösung:**
1. Überprüfe **exakte Schreibweise** der Variable-Namen
2. Stelle sicher dass Werte ohne Anführungszeichen eingegeben wurden
3. Trigger einen neuen Deploy

### Problem 3: Login funktioniert nicht

**Ursache:** Supabase Auth noch nicht konfiguriert

**Lösung:**
1. Gehe zu Supabase Dashboard → Authentication → Providers
2. Aktiviere "Email" Provider
3. Setze **Site URL** auf `https://coachflow1.netlify.app`
4. Füge `https://coachflow1.netlify.app/**` zu **Redirect URLs** hinzu

### Problem 4: Zahlungen funktionieren nicht

**Ursache:** Stripe nicht konfiguriert oder Demo-Modus aktiv

**Lösung:**
- Im **Demo-Modus** kannst du trotzdem registrieren und Pläne "kaufen" (ohne echte Zahlung)
- Für echte Zahlungen: Setze `STRIPE_PUBLISHABLE_KEY` in Netlify

---

## 📊 Deployment Status

### ✅ Was wurde bereits behoben:

- [x] Build-Script verbessert (`build.js`)
- [x] Build schlägt nicht mehr fehl bei fehlenden Env Vars
- [x] Bessere Fehlermeldungen und Warnungen
- [x] Dokumentation erstellt (README.md, NETLIFY_FIX.md)
- [x] `.env.example` für lokale Entwicklung
- [x] Git Repository initialisiert

### ⏳ Was du tun musst:

- [ ] Environment Variables in Netlify setzen (Schritt 3)
- [ ] Rebuild triggern (Schritt 4)
- [ ] Seite testen (Schritt 6)
- [ ] (Optional) Supabase Auth konfigurieren
- [ ] (Optional) Stripe für echte Zahlungen aktivieren

---

## 🎓 Weitere Ressourcen

- **Vollständige Dokumentation:** Siehe `README.md`
- **Schnellstart-Guide:** Siehe `NETLIFY_FIX.md`
- **Environment Variables:** Siehe `.env.example`

---

## 📞 Support

Falls Probleme auftreten:

1. **Screenshot vom Deploy Log** machen (Deploys → Latest → Deploy log)
2. **Screenshot von Environment Variables** (Keys/Werte ausblenden!)
3. **Browser Console** Fehler (F12 → Console Tab)
4. Kontakt: support@coachflow.de

---

## 🎉 Erfolg!

Wenn alles funktioniert:
- ✅ https://coachflow1.netlify.app/ lädt ohne 404
- ✅ Alle Seiten sind erreichbar
- ✅ Login/Registrierung funktioniert
- ✅ Content-Bereiche sind sichtbar

**Glückwunsch!** 🚀 Deine CoachFlow-Plattform ist jetzt live!

---

**Nächste Schritte:**
1. Supabase Database Schema einrichten (siehe README.md)
2. Content hochladen (Videos, Dokumente, Bilder)
3. Stripe Subscription-Produkte erstellen
4. Resend E-Mail Templates einrichten
5. Custom Domain verbinden (optional)
