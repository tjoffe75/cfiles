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

## Systemöversikt

Systemet består av följande container-baserade tjänster som definieras i `docker-compose.yml`:

* **Frontend (React)**
* **Backend API (FastAPI)**
* **Workers (Python)**
* **Meddelandekö (RabbitMQ)**
* **Databas (PostgreSQL)**
* **Virusskanner (ClamAV)**

---

## diagrama de Arquitectura

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

* **Frontend (React)**
    * Ansvar: Webbaserat UI för filuppladdning och status.
    * Portabilitet: Anonym Docker-volym för node_modules säkerställer konsekvent miljö.
    * UI/UX: Modernt, responsivt gränssnitt med dark mode.
    * Miljövariabler skapas automatiskt via script.
    * Interaktioner: Kommunicerar med Backend API via HTTP.
    * Framtid: Adminpanel för konfiguration och karantänhantering.

* **Backend API (FastAPI)**
    * Ansvar: Tar emot filuppladdningar, validerar, sparar temporärt och skapar post i DB (status PENDING). Publicerar meddelande till RabbitMQ.
    * Interaktioner: Lyssnar på port 8000, ansluter till PostgreSQL och RabbitMQ.

* **Workers (Python)**
    * Ansvar: Konsumerar jobb från file_queue, uppdaterar status till SCANNING, skannar med ClamAV, uppdaterar status till CLEAN/INFECTED.
    * Interaktioner: RabbitMQ, PostgreSQL, ClamAV via TCP.

* **Meddelandekö (RabbitMQ)**
    * Ansvar: Frikopplar backend från workers, robust och skalbart.
    * Interaktioner: Tar emot meddelanden från backend, skickar till workers.

* **Databas (PostgreSQL)**
    * Ansvar: Lagrar filinformation och systemkonfiguration.
    * Persistens: Docker-volym för data.

* **Virusskanner (ClamAV)**
    * Ansvar: Skannar filer efter virus/skadlig kod.
    * Interaktioner: Lyssnar på port 3310 från workers.

---

## Tjänsteöversikt

Systemet består av följande container-baserade tjänster:
- **Frontend (React)**
- **Backend API (FastAPI)**
- **Workers (Python)**
- **Meddelandekö (RabbitMQ)**
- **Databas (PostgreSQL)**
- **Virusskanner (ClamAV)**

---

## 🌐 Nätverk och Datalagring

* Alla tjänster är anslutna till ett gemensamt Docker bridge-nätverk.
* Volymer: `./uploads`, `./quarantine`, `postgres-data`, kodvolymer för utveckling, anonym volym för node_modules.

---

## 🛡️ Karantänfunktion (Implementerad)

När en fil identifieras som INFECTED:
1. Statusuppdatering i DB.
2. Filen flyttas till `/quarantine`.
3. Unikt suffix om filnamn redan finns.
4. Sökväg i DB uppdateras.

---

## 📜 Databasstruktur

Se backend/database.py och models.py för aktuell struktur. Vision: utökad tabell för scans och admin_config.

---

## 🔐 RBAC/SSO-konfiguration (Implementerat)

Systemet kan köras i två lägen: AUTH_MODE=OFF (ingen auth, dev/test) och AUTH_MODE=ON (SSO/RBAC via AD, produktion). Funktionaliteten är fullt implementerad och kan styras via adminpanelen och miljövariabler.

---

## 🔧 Maintenance Mode (Implementerat)

Systemet kan sättas i underhållsläge via miljövariabel eller adminpanelen. Frontend visar då underhållsmeddelande, backend returnerar 503 på relevanta endpoints. Funktionaliteten är fullt implementerad.

---

## 🔒 HTTPS och Certifikathantering (Vision)

All extern trafik ska gå över HTTPS. Detta hanteras av reverse proxy (t.ex. Traefik eller Nginx) – **proxy-styrning är ett framtida utvecklingsområde**.

---

## Proxy och scriptstyrning

Reverse proxy (Traefik eller Nginx) är utbytbar och styrs via script (t.ex. `switch_proxy.ps1`). Se README.md för instruktioner. All trafik (API, frontend, WebSocket) går via proxy om den är aktiverad.

---

## 🎯 Informationsflöden

Implementerat: Användare → Frontend → Backend API → RabbitMQ → Worker → ClamAV & PostgreSQL

- SSO/AD, Maintenance Mode och förbättrad adminpanel är fullt implementerat och används i produktionen.

---

## ⚙️ Adminpanel & Konfiguration (Implementerat)

- Adminpanelens konfigurationssektion är fullt funktionell.
- Exempel: Slå på/av SSO/RBAC, redigera SSO/AD-inställningar, toggla Maintenance Mode, dark mode, loggläsare, branding, säkerhet, CI/CD, UI-förbättringar.

---

## ✅ Implementerat (Juli 2025)

- Filuppladdning, scanning, statusuppdatering och karantän är fullt implementerat och testat.
- Nedladdning av filer fungerar via både UI och API.

---

## 🚧 Kommande utveckling

- Scriptstyrd och portabel reverse proxy (Nginx/Traefik) för all trafik.
- Automatisk certifikathantering och proxy-växling via script.
- Fler adminfunktioner och förbättrad logghantering.
- Full SSO/RBAC-integration.
- Fler robusta felsöknings- och övervakningsverktyg.

---

## 🛠️ Vanliga fel och felsökning

- **CORS-fel:** Kontrollera proxy-konfiguration och att rätt headers sätts.
- **413 Request Entity Too Large:** Öka `client_max_body_size` i Nginx.
- **WebSocket-problem:** Säkerställ att proxy tillåter och vidarebefordrar WebSocket-trafik.
- **RabbitMQ-anslutning:** Kontrollera att `RABBITMQ_HOST` är korrekt satt i `.env`.
- **Worker startar inte:** Kontrollera att alla beroenden är installerade och att rätt entrypoint används.

Se även loggar via Docker Compose och adminpanelens loggläsare.

---

## 🔮 Framtida utvecklingsområde: Reverse Proxy (Nginx/Traefik)

Reverse proxy (t.ex. Nginx eller Traefik) används inte i nuvarande arkitektur, men är planerat som ett framtida utvecklingsområde. Syftet är att möjliggöra central hantering av HTTPS, lastbalansering, certifikat och säker trafik mellan användare och applikationen. Implementation ska ske portabelt och scriptstyrt enligt projektets riktlinjer, så att miljön enkelt kan växlas mellan olika proxy-lösningar utan manuell hantering.

**Planerade mål:**
- Scriptstyrd växling mellan Nginx och Traefik för lokal utveckling och produktion
- Automatisk certifikathantering (Let's Encrypt)
- Central hantering av CORS, WebSocket och API-routing
- Fullt portabel och dokumenterad lösning

> Se PROJECT.md och roadmap för detaljerad planering och status.

