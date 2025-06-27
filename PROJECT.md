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

## ✅ Nuvarande Status (Juni 2025)

Projektet har ett fungerande end-to-end-flöde för säker filuppladdning, asynkron virusskanning och hantering av infekterade filer.

**Vad som är implementerat och fungerar:**
*   **Backend API (`/config/upload/`)**: Tar emot filuppladdningar och sparar filinformation i databasen med status `PENDING`.
*   **Asynkron bearbetning**: Meddelanden publiceras till RabbitMQ för att initiera skanningsjobb.
*   **Worker & Skanning**: En worker konsumerar jobb från kön, uppdaterar status till `SCANNING` och skannar filen med ClamAV.
*   **Databasintegration**: Filens status (`CLEAN`, `INFECTED`, `ERROR`) uppdateras kontinuerligt i PostgreSQL.
*   **🛡️ Karantänfunktion**: Infekterade filer flyttas automatiskt till en skyddad `/quarantine`-katalog och sökvägen i databasen uppdateras.
*   **Status-endpoint (`/config/files/`)**: Ett API som visar status för alla uppladdade filer.
*   **Frontend**: Ett grundläggande React-gränssnitt för att ladda upp filer och se deras status.
*   **Robusthet**: Inbyggd `retry`-logik för anslutningar till RabbitMQ, ClamAV och PostgreSQL.

---

## 🗺️ Projekt-Roadmap (Resterande Vision)

Följande funktioner från den ursprungliga arkitekturen återstår att implementera:

1.  **Utveckla Frontend-Adminpanel:**
    *   Loggläsare för applikationsloggar.
    *   Hantering av filer i karantän (frigivning eller radering).
    *   En översiktsvy för systemstatus.
2.  **Implementera Backend för Konfiguration:**
    *   Endpoints för att hantera `maintenance mode`, `SSO/RBAC`, och `HTTPS`-certifikat.
    *   Logik för att ladda upp företagslogotyp.
3.  **Säkerhet och Autentisering:**
    *   Implementera JWT-autentisering.
    *   Full integration mot Active Directory för SSO och RBAC.
4.  **checksum:**
    *   Implementera en checksum check funktion  .
5.  **Drift och Övervakning:**
    *   Sätta upp CI/CD-pipelines (t.ex. GitHub Actions).
    *   Etablera central logghantering (t.ex. Elastic Stack).
