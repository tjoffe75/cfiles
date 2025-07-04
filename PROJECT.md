# cfiles – Projektets riktlinjer

## Grundläggande principer

1. **Inget får gå sönder**
   - Alla ändringar ska ta hänsyn till befintlig kod och funktionalitet.
   - Existerande features ska alltid fortsätta fungera efter en ändring.

2. **Modularitet**
   - Koden ska vara modulär och uppdelad i tydliga, återanvändbara komponenter och funktioner.
   - Undvik duplicering och hårdkodning.

3. **Robusthet**
   - All kod ska ha robust felhantering, särskilt för filhantering, autentisering och WebSocket.
   - Systemet ska klara oväntade situationer utan att krascha eller ge dålig användarupplevelse.

4. **Modern och lättanvänd UI**
   - Frontend ska vara modern, tydlig och enkel att använda.
   - UI-komponenter ska vara konsekventa och följa best practices.

5. **Felhantering**
   - Alla endpoints och UI-flöden ska ha tydlig och användarvänlig felhantering.
   - Loggning ska finnas för felsökning, men inte störa användaren.

6. **Utvecklarläge (dev mode) och fejkuser**
   - När SSO/RBAC är avstängt (RBAC_SSO_ENABLED = false) används automatiskt en fejk-användare ("devuser") för alla API-anrop.
   - "devuser" har rollerna ["admin", "user"] och kräver ingen Authorization-header.
   - Detta gäller endast i utvecklingsläge och får inte påverka säkerheten i produktion.
   - All fil- och folderhantering i dev mode kopplas till "devuser".

7. **Följ projektets dokumentation**
   - Följ alltid riktlinjer i `PROJECT.md`, `ARCHITECTURE.md` och annan dokumentation.
   - Om du är osäker, läs in dessa filer innan du gör ändringar.

---

# 🚀 Projektvision – cfiles

Detta dokument beskriver det övergripande syftet, den nuvarande statusen och den framtida visionen för **cfiles**-applikationen.

---

## 🎯 Syfte och Mål (Vision)

Applikationens primära syfte är att erbjuda en robust och säker plattform för skanning av filer, med fokus på automatisk säkerhetskontroll och skalbarhet.

**Kärnfunktionalitet (Vision):**
*   Säker uppladdning av filer.
*   Automatisk och asynkron virus- och checksum-scanning.
*   En centraliserad karantän för infekterade eller misstänkta filer.
*   En komplett adminpanel för systemkonfiguration, övervakning och hantering.
*   Möjlighet att ladda ner skanningsrapporter.
*   Stöd för SSO (Single Sign-On) och RBAC (Role-Based Access Control) via Active Directory.

---

## ✅ Nuvarande status (Juli 2025)

- All grundläggande funktionalitet är klar: filuppladdning, scanning, statusuppdatering och karantän fungerar stabilt.
- Nedladdning av filer är implementerat och testat.
- Status för filer uppdateras i realtid i UI:t.

Projektet har ett fungerande end-to-end-flöde för säker filuppladdning, asynkron virusskanning och hantering av infekterade filer. En adminpanel har implementerats för att ge administratörer insyn och kontroll över systemet.

**UI/UX (2025):**
*   Modernt, responsivt gränssnitt med centrerad titel och logotyp i vänstra hörnet.
*   Dark mode-toggle alltid synlig i top-baren.
*   Logotypen kan bytas ut genom att ersätta `frontend/public/logo-placeholder.svg`.
*   **Miljövariabler skapas automatiskt på Windows (init_env.ps1) och Linux/macOS (init_env.sh).**

**Vad som är implementerat och fungerar:**
*   **Backend API (`/config/upload/`)**: Tar emot filuppladdningar och sparar filinformation i databasen med status `PENDING`.
*   **Asynkron bearbetning**: Meddelanden publiceras till RabbitMQ för att initiera skanningsjobb.
*   **Worker & Skanning**: En worker konsumerar jobb från kön, uppdaterar status till `SCANNING` och skannar filen med ClamAV.
*   **Databasintegration**: Filens status (`CLEAN`, `INFECTED`, `ERROR`) uppdateras kontinuerligt i PostgreSQL.
*   **🛡️ Karantänfunktion**: Infekterade filer flyttas automatiskt till en skyddad `/quarantine`-katalog och sökvägen i databasen uppdateras.
*   **Status-endpoint (`/config/files/`)**: Ett API som visar status för alla uppladdade filer.
*   **Frontend**: Ett grundläggande React-gränssnitt för att ladda upp filer och se deras status.
*   **Adminpanel**: En adminpanel där administratörer kan ändra systeminställningar, slå på/av SSO/RBAC, toggla Maintenance Mode, hantera loggar och karantän. Statusbanderoller för SSO och Maintenance Mode visas alltid.
*   **Robusthet**: Inbyggd `retry`-logik för anslutningar till RabbitMQ, ClamAV och PostgreSQL.

---

## ⚙️ Adminpanel – Nuvarande läge

> **Notera:** Adminpanelens "⚙️ Configuration"-sektion är nu fullt funktionell. Administratörer kan ändra systeminställningar direkt via UI:t, inklusive att slå på/av SSO/RBAC (RBAC_SSO_ENABLED), redigera SSO/AD-inställningar (med inline-validering), och toggla Maintenance Mode. Alla ändringar valideras direkt i gränssnittet, panelen har full dark mode-stöd och robust felhantering. Vid aktiverad RBAC/SSO krävs admin-behörighet (JWT-token) för att ändra kritiska inställningar.

### Globala status-banderoller
En ny funktion har implementerats för att visa globala status-banderoller överst i applikationen. Dessa banderoller är alltid synliga när respektive läge är aktivt och säkerställer att administratörer och användare är medvetna om systemets status.

- **Maintenance Mode-banderoll**: Visas när systemet är i underhållsläge.
- **RBAC/SSO-banderoll**: Visas när `RBAC_SSO_ENABLED` är satt till `false`, för att varna om att applikationen körs i ett öppet, osäkrat läge.

## 🗺️ Projekt-Roadmap (Resterande Vision)

Följande funktioner från den ursprungliga arkitekturen återstår att implementera:

1.  **Implementera Backend för Konfiguration:**
    *   Endpoints för att hantera `maintenance mode`, `SSO/RBAC`, och `HTTPS`-certifikat.
    *   Logik för att ladda upp företagslogotyp.
2.  **Säkerhet och Autentisering:**
    *   Implementera JWT-autentisering.
    *   Full integration mot Active Directory för SSO och RBAC.
3.  **Checksum:**
    *   Implementera en checksum check funktion.
4.  **Drift och Övervakning:**
    *   Sätta upp CI/CD-pipelines (t.ex. GitHub Actions).
    *   Etablera central logghantering (t.ex. Elastic Stack).

## 🤝 Hur bidrar man?

- Skapa alltid en feature-bransch från main.
- Följ riktlinjer i COPILOT_GUIDELINES.md och PROJECT.md.
- Gör en pull request (PR) mot main när din feature är klar och testad.
- Beskriv ändringar tydligt i PR och uppdatera dokumentation vid behov.

## Proxy (Reverse Proxy)

> Reverse proxy (Traefik/Nginx) används inte i nuvarande arkitektur, men är planerat som ett framtida utvecklingsområde. När proxy införs kommer den vara utbytbar och scriptstyrd enligt projektets riktlinjer. Se ARCHITECTURE.md för detaljer.
