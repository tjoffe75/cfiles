# cfiles – Grundläggande riktlinjer (sammanfattning)

Se även PROJECT.md för fullständig lista.

- Inget får gå sönder: Ändringar får aldrig bryta befintlig funktionalitet.
- Modularitet: All kod ska vara modulär och återanvändbar.
- Robusthet: Felhantering och stabilitet är centralt.
- Modern, lättanvänd UI: Frontend ska vara tydlig och modern.
- Felhantering: Tydlig, användarvänlig och loggad.
- Dev mode: "fejkuser" (devuser) används när SSO/RBAC är avstängt. Alla fil- och adminflöden kopplas då till devuser och ingen auth krävs.
- Följ alltid dokumentation och riktlinjer i PROJECT.md och ARCHITECTURE.md.

# 📚 Systemarkitektur – cfiles

Detta dokument beskriver den tekniska arkitekturen, datastrukturen och interaktionerna mellan komponenter i **cfiles**-projektet.

---

##  diagrama de Arquitectura

Följande diagram illustrerar trafikflödet och relationen mellan tjänsterna. All extern trafik dirigeras genom Traefik, som hanterar HTTPS och dirigerar förfrågningar till rätt tjänst.

```
                +-----------------------------------------------------------------
                | User (Web Browser)
                +-----------------------------------------------------------------
                      |
                      | HTTPS (Port 443)
                      v
+---------------------+------------------+
|  Traefik (Reverse Proxy)               |
|  - Handles TLS/SSL Termination         |
|  - Routes traffic based on Host & Path |
|  - /api/* or /ws/* -> Backend Service  |
|  - All other traffic -> Frontend Service|
+---------------------+------------------+
           |                             |
           | (Forwards Request)          | (Forwards Request)
           v                             v
+---------------------+------------------+      +-------------------+------------------+
|  Frontend (React)                      |      |  Backend API (FastAPI)             |
|  - Serves the user interface           |      |  - Handles API and WebSocket requests|
|  - Manages UI state                    |      |  - Writes to DB (Status: PENDING)    |
|  - Admin Panel UI                      |      |  - Publishes jobs to RabbitMQ      |
+----------------------------------------+      +-------------------+------------------+
                                                                      |           ^
                                                                      | AMQP      | DB Calls (PostgreSQL)
                                                                      v           |
+----------------------------------------+      +---------------------+-----------+------ +
|  Message Queue (RabbitMQ)              |      |  Database (PostgreSQL)                 |
|  - `file_queue` for async jobs         |<---->|  - Stores file metadata, status, etc.  |
|  - Decouples API from workers          |      |  - Uses a persistent volume (pg-data)  |
+----------------------------------------+      +----------------------------------------+
      |
      | AMQP (Consumes Jobs)
      v
+---------------------+------------------+
|  Workers (Python)  (Scalable)          |
|  - Listens to `file_queue`             |
|  - Updates DB (Status: SCANNING)       |
|  - Calls ClamAV for scanning           |----TCP (Port 3310)-->+--------------------------+
|  - Updates DB (Status: CLEAN/INFECTED) |                      |  Virus Scanner (ClamAV)  |
|  - Moves infected files to /quarantine |                      |  - Scans files for malware |
+----------------------------------------+                      +--------------------------+

```

---

## ⚖️ Scalability and Robustness

This architecture is inherently scalable and robust due to the decoupling of its components:

-   **Stateless Services**: The `backend` and `workers` are stateless, meaning you can run multiple instances of them without conflict.
-   **Load Balancing**: Traefik can automatically load balance traffic across multiple instances of the `frontend` and `backend` services.
-   **Asynchronous Processing**: By using RabbitMQ, the time-consuming scanning process is handled asynchronously. If there is a sudden influx of file uploads, they simply queue up, preventing the API from becoming overloaded. The system can catch up later by processing the queue.
-   **Scalable Workers**: The most resource-intensive part of the system is the `workers`. You can easily scale up the number of worker containers to handle a higher load of file scans, without affecting the rest of the system. This can be done by running: `docker-compose up --scale workers=5 -d`.

---

## Component Overview

*   **Traefik (Reverse Proxy)**
    *   **Role**: The single, scalable entry point for all incoming traffic. It secures the application via HTTPS and load balances requests to the correct service.

*   **Frontend (React)**
    *   **Role**: Provides the web-based user interface. Can be scaled to multiple instances if user traffic becomes extremely high.
    *   **Portability**: Uses an anonymous Docker volume for `node_modules` to ensure the container is fully portable.

*   **Backend API (FastAPI)**
    *   **Role**: Handles all business logic. As a stateless service, it can be scaled to multiple instances to handle a high volume of API requests.
    *   **Interactions**: Listens for traffic from Traefik, connects to the database, and publishes jobs to RabbitMQ.

*   **Workers (Python)**
    *   **Role**: The primary component for scalability. These workers process scan jobs asynchronously. You can increase the number of worker containers to increase the scanning throughput of the entire system.
    *   **Interactions**: Subscribes to RabbitMQ, connects to the database, and communicates with ClamAV.

*   **Message Queue (RabbitMQ)**
    *   **Role**: The core of the system's robustness and scalability. It decouples the `backend` from the `workers`, ensuring that jobs are never lost.

*   **Database (PostgreSQL)**
    *   **Role**: The persistent storage for all application data. For very high-scale deployments, this could be moved to a managed database cluster.

*   **Virus Scanner (ClamAV)**
    *   **Role**: A dedicated service for scanning files. For extreme-scale deployments, one could explore strategies for scaling the scanning service itself.

---

## 🌐 Nätverk och Datalagring

*   **Nätverk**: Alla tjänster är anslutna till ett gemensamt Docker bridge-nätverk, `filesapp-network`. Detta gör att de kan kommunicera med varandra via sina tjänstnamn (t.ex. kan `backend` nå `postgres` på `postgres:5432`).
*   **Volymer (Datalagring)**:
    *   `./uploads` och `./quarantine`: Dessa mappar delas mellan `backend`, `workers` och `clamav` för att ge alla tjänster åtkomst till filerna.
    *   `postgres-data`: En namngiven volym som säkerställer att databasens data är persistent.
    *   Kod-volymer (`./frontend:/app`, `./backend:/app`): Används för utveckling för att spegla kodändringar direkt i containern.
    *   **Anonym volym (`/app/node_modules` i `frontend`):** Denna kritiska inställning säkerställer att den `node_modules`-katalog som byggs inuti Docker-containern alltid används. Det förhindrar att en eventuell `node_modules`-mapp på värddatorn (som kan ha andra beroenden eller versioner) monteras och skriver över den i containern. Resultatet är en helt portabel frontend-miljö som fungerar likadant överallt, utan krav på att köra `npm install` manuellt på värddatorn.

---

## 🛡️ Karantänfunktion (Implementerad)

När en fil av virus-workern identifieras som `INFECTED` sker följande:
1.  **Statusuppdatering**: Filens status i databasen sätts till `INFECTED`.
2.  **Flytt**: Filen flyttas från uppladdningskatalogen (`/uploads`) till en isolerad karantänkatalog (`/quarantine`).
3.  **Namngivning**: Om en fil med samma namn redan finns i karantänen får den nya filen ett unikt suffix (t.ex. `eicar_test_1.txt`).
4.  **Sökvägsuppdatering**: Filens `filepath` i databasen uppdateras för att peka på den nya platsen i karantänmappen.

---

## 📜 Databasstruktur

### Implementerad Struktur
Den nuvarande databasmodellen i `backend/database.py` och `models.py` definierar en `files`-tabell:

```python
class File(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    filepath = Column(String, unique=True, index=True)
    status = Column(String, default="PENDING")
    scan_result = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### Vision för Databasstruktur
En framtida utökning inkluderar en `admin_config`-tabell och mer detaljerade fält i `scans` (motsvarar nuvarande `files`-tabell).

```sql
-- Vision
CREATE TABLE scans (
  id UUID PRIMARY KEY,
  filename TEXT NOT NULL,
  status TEXT,
  virus_result JSONB,
  checksum_results JSONB,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE admin_config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔐 RBAC/SSO-konfiguration (Vision)

Systemet ska kunna köras i två lägen gällande autentisering och auktorisering, vilket styrs av en konfigurationsvariabel (t.ex. en miljövariabel `AUTH_MODE` som kan vara `ON` eller `OFF`).

### Läge: `AUTH_MODE=OFF` (Standard)

*   **Beskrivning**: Ingen autentisering krävs. Systemet är helt öppet och alla som når webbgränssnittet kan ladda upp filer.
*   **Användningsfall**: Enkel, intern användning där nätverket i sig anses vara säkert, eller för testning och demonstration.
*   **Effekt**:
    *   Frontend visar uppladdningssidan direkt.
    *   Backend validerar inte någon användare eller token.
    *   Ingen koppling mot Active Directory (AD) eller annan SSO-leverantör görs.

### Läge: `AUTH_MODE=ON`

*   **Beskrivning**: Fullständig autentisering och rollbaserad åtkomstkontroll (RBAC) via Single Sign-On (SSO) med Active Directory.
*   **Användningsfall**: Produktionsmiljöer i företag där man behöver säkerställa att endast behöriga användare kan ladda upp filer och administrera systemet.
*   **Effekt**:
    *   **Frontend**: Omdirigerar användaren till organisationens SSO-inloggningssida. Efter lyckad inloggning hämtas en token (t.ex. JWT).
    *   **Backend**: Alla anrop till skyddade ändpunkter (t.ex. `/upload`, `/admin/*`) måste innehålla en giltig JWT. API:et validerar token mot AD.
    *   **Roller**: Systemet kommer att ha minst två roller:
        *   `User`: Kan ladda upp filer och se status på sina egna uppladdningar.
        *   `Admin`: Har fulla rättigheter, inklusive att se alla filer, hantera karantän och ändra systemkonfiguration via adminpanelen.

### Konfigurationstabell

| `AUTH_MODE` | Autentisering | Användarroller | Adminpanel | Målmiljö      |
| :---------- | :-------------- | :------------- | :--------- | :-------------- |
| **`OFF`**   | Nej             | N/A            | Ej aktiv   | Test, Demo      |
| **`ON`**    | Ja (SSO/AD)     | `User`, `Admin`  | Aktiv      | Produktion      |

---

## 🔧 Maintenance Mode (Vision)

Systemet ska kunna sättas i ett underhållsläge via en miljövariabel, t.ex. `MAINTENANCE_MODE=ON`.

*   **Syfte**: Att kunna stänga ner möjligheten för användare att ladda upp filer under planerade underhåll, uppdateringar eller vid felsökning av kritiska problem.
*   **Effekt**:

    *   **Frontend**: Istället för uppladdningsgränssnittet visas en statisk sida med ett meddelande om att systemet är under underhåll och när det förväntas vara tillgängligt igen.
    *   **Backend**: `/upload`-ändpunkten och andra relevanta API-anrop returnerar en `503 Service Unavailable`-status med ett informativt meddelande.
    *   Adminpanelen kan fortfarande vara tillgänglig för administratörer för att de ska kunna hantera systemet under underhållsfönstret.

---

## 🔒 HTTPS och Certifikathantering (Implementerat)

För att säkerställa säker kommunikation kan all extern trafik till applikationen nu hanteras över HTTPS. Systemet är byggt för att integreras med en **Reverse Proxy** (som Traefik, konfigurerad i `docker-compose.yml`), vilken terminerar SSL/TLS-anslutningar.

**Nyckelfunktioner:**
*   **Admin-UI för HTTPS**: Administratörer kan nu direkt via konfigurationspanelen:
    *   **Aktivera eller avaktivera HTTPS** globalt för applikationen.
    *   **Ladda upp anpassade SSL-certifikat**, inklusive certifikatfil (`cert.pem`) och privat nyckel (`key.key`).
*   **Dynamisk Konfiguration**: Systemet sparar inställningarna och certifikaten på en delad volym som reverse proxyn (Traefik) använder för att dynamiskt och säkert applicera TLS-konfigurationen.
*   **Ansvarsfördelning**:
    *   **Reverse Proxy (Traefik)**: Ansvarar för att terminera SSL/TLS och dirigera trafiken. Den använder routrar för att skicka trafik till rätt tjänst: en för HTTP som omedelbart omdirigerar till HTTPS, och en för HTTPS som skickar trafik vidare till antingen `frontend` (standard) eller `backend` (om sökvägen börjar med `/api`).
    *   **Applikationstjänster (cfiles)**: Tillhandahåller ett enkelt gränssnitt för att hantera konfigurationen utan att behöva redigera konfigurationsfiler manuellt. Applikationstjänsterna kommunicerar internt via HTTP i det skyddade Docker-nätverket.

---

## 🎯 Informationsflöden

### Implementerat Flöde
`Användare → Traefik (HTTPS) → [Frontend/Backend] → RabbitMQ → Virus-Worker → ClamAV & PostgreSQL`

### Vision för Informationsflöden
**Normal drift:**
`Användare → AD (SSO) → Traefik (HTTPS) → [Frontend/Backend] → RabbitMQ → Workers → DB → Resultat`

**Maintenance mode ON:**
`Användare → Blockerad → Underhållsmeddelande`

---

## ⚙️ Adminpanel & Konfiguration (Implementerat)

> **Notera:** Adminpanelens "⚙️ Configuration"-sektion är nu fullt funktionell. Administratörer kan ändra systeminställningar direkt via UI:t, inklusive att slå på/av SSO/RBAC (RBAC_SSO_ENABLED), redigera SSO/AD-inställningar (med inline-validering), och toggla Maintenance Mode. Alla ändringar valideras direkt i gränssnittet, panelen har full dark mode-stöd och robust felhantering. Vid aktiverad RBAC/SSO krävs admin-behörighet (JWT-token) för att ändra kritiska inställningar.

**Exempel på funktioner i konfigurationspanelen:**
- Slå på/av SSO/RBAC (RBAC_SSO_ENABLED)
- Redigera SSO/AD-inställningar (med inline-validering, t.ex. giltig URL, obligatoriska fält när SSO är aktivt)
- Toggla Maintenance Mode (kräver admin vid RBAC/SSO)
- Aktivera/avaktivera HTTPS
- Ladda upp anpassade SSL-certifikat (cert.pem och key.key)
- Alla inställningar har stöd för dark mode
- Felhantering och validering sker direkt i UI:t

**Teknisk not:** Backend säkerställer automatiskt vid varje uppstart att alla nödvändiga systeminställningar (t.ex. `RBAC_SSO_ENABLED`, `MAINTENANCE_MODE`, `HTTPS_ENABLED`) finns i databasen. Nya inställningar kan enkelt läggas till centralt och initieras automatiskt.

*   **Maintenance Mode**: Möjlighet att stänga av systemet för underhåll.
*   **SSO/RBAC**: Integration med Active Directory för rollbaserad åtkomst.
*   **HTTPS & Certifikat**: Hantering av TLS/SSL-certifikat via adminpanelen.
*   **Loggläsare**: Ett gränssnitt för att se och filtrera loggar från alla tjänster.
*   **Branding**: Möjlighet att ladda upp en egen logotyp.
*   **Dark Mode**: Global toggle för alla användare.
*   **Säkerhet**: JWT-autentisering, krypterad lagring.
*   **Drift**: CI/CD, övervakning med Prometheus/Grafana.
*   **UI-förbättringar**: Drag and drop-funktion för filuppladdning.

---

## ✅ Implementerat (Juli 2025)

- Filuppladdning, scanning, statusuppdatering och karantän är fullt implementerat och testat.
- Nedladdning av filer fungerar via både UI och API.

