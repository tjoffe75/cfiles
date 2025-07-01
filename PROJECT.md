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

## ✅ Nuvarande Status (Juli 2025)

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
*   **Adminpanel**: En nyligen tillagd adminpanel med följande funktioner:
    *   **Dashboard**: En översiktsvy för systemstatus.
    *   **Log Viewer**: Visar applikationsloggar.
    *   **Quarantine Manager**: Hanterar filer i karantän (frigivning eller radering).
*   **Robusthet**: Inbyggd `retry`-logik för anslutningar till RabbitMQ, ClamAV och PostgreSQL.

---

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
