# 📚 Systemarkitektur – cfiles

Detta dokument beskriver den tekniska arkitekturen, datastrukturen och interaktionerna mellan komponenter i **cfiles**-projektet.

---

##  diagrama de Arquitectura

```
                +-----------------------------------------------------------------+
                | Användare (Webbläsare)                                          |
                +-----------------------------------------------------------------+
                      |                                      ^
                      | HTTP/HTTPS (Port 3000)               |
                      v                                      |
+---------------------+------------------+<-- Nätverksanrop -->+-------------------+------------------+
|  Frontend (React)                      | (Port 8000)        |  Backend API (FastAPI)             |
|  - UI för uppladdning                  |                    |  - Hanterar anrop                  |
|  - Visar filstatus                     |                    |  - Skriver till DB (Status: PENDING) |
|  - Adminpanel                          |                    |  - Publicerar jobb till RabbitMQ   |
+----------------------------------------+                    +-------------------+------------------+
                                                                      |           ^
                                                                      | AMQP      | DB-anrop (PostgreSQL)
                                                                      v           |
+----------------------------------------+      +---------------------+-----------+------ +
|  Meddelandekö (RabbitMQ)               |      |  Databas (PostgreSQL)                  |
|  - file_queue                          |<---->|  - Lagrar fil-metadata, status, etc.   |
|  - Hanterar asynkrona jobb             |      |  - Använder persistent volym (pg-data) |
+----------------------------------------+      +----------------------------------------+
      |
      | AMQP (Konsumerar jobb)
      v
+---------------------+------------------+
|  Workers (Python)                      |
|  - Lyssnar på file_queue               |
|  - Uppdaterar DB (Status: SCANNING)    |
|  - Anropar ClamAV för skanning         |----TCP (Port 3310)-->+--------------------------+
|  - Uppdaterar DB (Status: CLEAN/INFECTED)|                    |  Virusskanner (ClamAV)   |
|  - Flyttar fil till /quarantine        |                    |  - Tar emot fil för skanning |
+----------------------------------------+                    +--------------------------+

```

---

## 📌 Komponentbeskrivning

Systemet består av följande container-baserade tjänster som definieras i `docker-compose.yml`:

*   **Frontend (React)**
    *   **Ansvar**: Tillhandahåller ett webbaserat användargränssnitt (UI) för att ladda upp filer och visa en lista med deras skanningsstatus i realtid.
    *   **UI/UX (2025):** Modernt, responsivt gränssnitt med centrerad titel, logotyp i vänstra hörnet och alltid synlig dark mode-toggle.
    *   **Miljövariabler skapas automatiskt på Windows (init_env.ps1) och Linux/macOS (init_env.sh).**
    *   **Interaktioner**: Kommunicerar med Backend API:et via HTTP-anrop.
    *   **Framtid**: Kommer att byggas ut med en adminpanel för konfiguration och hantering av karantän.

*   **Backend API (FastAPI)**
    *   **Ansvar**: Tar emot filuppladdningar, validerar indata, sparar filen temporärt och skapar en post i databasen med status `PENDING`. Publicerar därefter ett meddelande med filens ID till RabbitMQ för asynkron bearbetning.
    *   **Interaktioner**: Lyssnar på port `8000`, ansluter till PostgreSQL-databasen och publicerar meddelanden till RabbitMQ.

*   **Workers (Python)**
    *   **Ansvar**: Systemets "arbetshäst". En eller flera processer som körs i bakgrunden och lyssnar på jobb från `file_queue` i RabbitMQ. När ett jobb tas emot, uppdateras filens status till `SCANNING`, filen skickas till ClamAV, och slutligen uppdateras statusen till `CLEAN` eller `INFECTED`.
    *   **Interaktioner**: Prenumererar på meddelanden från RabbitMQ, ansluter till databasen för att uppdatera status, och kommunicerar med ClamAV via TCP.

*   **Meddelandekö (RabbitMQ)**
    *   **Ansvar**: Fungerar som en mellanhand för att frikoppla backend från workers. Detta gör systemet robust och skalbart; om en worker kraschar, ligger jobbet kvar i kön.
    *   **Interaktioner**: Tar emot meddelanden från Backend API och skickar dem vidare till en tillgänglig worker.

*   **Databas (PostgreSQL)**
    *   **Ansvar**: Lagrar all persistent data, inklusive filinformation (namn, sökväg, status, skanningsresultat) och framtida systemkonfiguration.
    *   **Persistens**: Använder en Docker-volym (`postgres-data`) för att säkerställa att datan överlever omstart av containern.

*   **Virusskanner (ClamAV)**
    *   **Ansvar**: En dedikerad tjänst för att skanna filer efter virus och skadlig kod.
    *   **Interaktioner**: Lyssnar på nätverksanrop (port `3310`) från `workers`-tjänsten.

---

## 🌐 Nätverk och Datalagring

*   **Nätverk**: Alla tjänster är anslutna till ett gemensamt Docker bridge-nätverk, `filesapp-network`. Detta gör att de kan kommunicera med varandra via sina tjänstnamn (t.ex. kan `backend` nå `postgres` på `postgres:5432`).
*   **Volymer (Datalagring)**:
    *   `./uploads` och `./quarantine`: Dessa mappar delas mellan `backend`, `workers` och `clamav` för att ge alla tjänster åtkomst till filerna.
    *   `postgres-data`: En namngiven volym som säkerställer att databasens data är persistent.
    *   Kod-volymer (`./frontend:/app`, `./backend:/app`): Används för utveckling för att spegla kodändringar direkt i containern.

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

## 🔒 HTTPS och Certifikathantering (Vision)

För att säkerställa säker kommunikation ska all extern trafik till applikationen gå över HTTPS.

*   **Implementation**: Detta hanteras inte direkt i applikationstjänsterna (frontend/backend) utan av en **Reverse Proxy** (t.ex. Traefik, som kan konfigureras i `docker-compose.yml`, eller Nginx).
*   **Ansvarsfördelning**:
    *   **Reverse Proxy**: Terminerar SSL/TLS-anslutningar. Den ansvarar för att hantera certifikat.
    *   **Applikationstjänster**: Kommunicerar internt via HTTP, eftersom de körs i ett skyddat Docker-nätverk.
*   **Automatisk Certifikatförnyelse**: Genom att använda en reverse proxy med Let's Encrypt-integration kan SSL-certifikat skapas och förnyas automatiskt, vilket minimerar manuell hantering och säkerställer att certifikaten aldrig går ut.

---

## 🎯 Informationsflöden

### Implementerat Flöde
`Användare → Frontend (React) → Backend API (FastAPI) → RabbitMQ → Virus-Worker → ClamAV & PostgreSQL`

### Vision för Informationsflöden
**Normal drift:**
`Användare → AD (SSO) → API → RabbitMQ → Workers → DB → Resultat`

**Maintenance mode ON:**
`Användare → Blockerad → Underhållsmeddelande`

---

## ⚙️ Vision för Adminpanel & Konfiguration

*   **Maintenance Mode**: Möjlighet att stänga av systemet för underhåll.
*   **SSO/RBAC**: Integration med Active Directory för rollbaserad åtkomst.
*   **HTTPS & Certifikat**: Hantering av TLS/SSL-certifikat.
*   **Loggläsare**: Ett gränssnitt för att se och filtrera loggar från alla tjänster.
*   **Branding**: Möjlighet att ladda upp en egen logotyp.
*   **Dark Mode**: Global toggle för alla användare.
*   **Säkerhet**: JWT-autentisering, krypterad lagring.
*   **Drift**: CI/CD, övervakning med Prometheus/Grafana.

---

## ✅ Implementerat (Juli 2025)

- Filuppladdning, scanning, statusuppdatering och karantän är fullt implementerat och testat.
- Nedladdning av filer fungerar via både UI och API.
- Status för filer uppdateras i realtid i användargränssnittet.
