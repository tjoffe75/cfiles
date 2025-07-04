# cfiles - Secure File Upload & Scan

## 🚀 Quick Start

1. **Klona repot:**
   ```bash
   git clone <your-repo-url>
   cd cfiles
   ```
2. **Initiera miljön:**
   - Windows: `./init_env.ps1`
   - Linux/macOS: `bash init_env.sh`
3. **Starta alla tjänster:**
   ```bash
   docker compose up -d --build
   ```

> Se även [COPILOT_GUIDELINES.md](COPILOT_GUIDELINES.md) för arbetsflöde och kodningsregler.

---

## Modern UI Features (2025)

- Nytt modernt gränssnitt med centrerad titel och logotyp i vänstra hörnet.
- Alltid synlig dark mode-toggle längst upp till höger.
- SSO/RBAC-statusbanner alltid överst.
- Snygg och responsiv sidomeny (SideNav).
- Logotypen kan bytas ut genom att ersätta `frontend/public/logo-placeholder.svg`.

---

## 1. Tech Stack

*   **Backend**: FastAPI (Python)
*   **Frontend**: React
*   **Message Queue**: RabbitMQ
*   **Worker**: Python
*   **Database**: PostgreSQL
*   **Virus Scanner**: ClamAV
*   **Containerization**: Docker & Docker Compose

## 2. Getting Started

**Prerequisites:**
*   Docker
*   Docker Compose
*   (Optional) Node.js LTS if you want to run the frontend outside Docker

**Environment setup:**
- On **Windows** (PowerShell):
  ```powershell
  ./init_env.ps1
  ```
- On **Linux/macOS** (bash):
  ```bash
  bash init_env.sh
  ```
- Dessa skript kommer automatiskt att skapa `.env` och `frontend/.env` med slumpmässiga säkra värden om de inte redan finns.
- Skripten sätter alltid `RABBITMQ_HOST=rabbitmq` i `.env` för Docker Compose-miljö (ingen manuell ändring krävs).
- Du kan redigera `.env` och `frontend/.env` manuellt om du vill ändra några värden.

**Ins1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd cfiles
    ```
2.  **Create environment files:** (se ovan)
3.  **Build and start all services:**
    ```bash
    docker compose up -d --build
    ```
4.  The application is now running:
    *   **Frontend**: [http://localhost:3000](http://localhost:3000)
    *   **Backend API**: [http://localhost:8000](http://localhost:8000)

## 3. Usage

Use the web interface at [http://localhost:3000](http://localhost:3000) to upload and view files. You can also use the API directly.

**Check status via API:**
```bash
curl http://localhost:8000/config/files/
```

**Inspect the quarantine directory:**
```bash
docker compose exec backend ls /quarantine
```

## ⚙️ Adminpanel – Nuvarande läge

> **Notera:** Adminpanelens "⚙️ Configuration"-sektion är nu fullt funktionell. Administratörer kan ändra systeminställningar direkt via UI:t, inklusive att slå på/av SSO/RBAC (RBAC_SSO_ENABLED), redigera SSO/AD-inställningar (med inline-validering), och toggla Maintenance Mode. Alla ändringar valideras direkt i gränssnittet, panelen har full dark mode-stöd och robust felhantering. Vid aktiverad RBAC/SSO krävs admin-behörighet (JWT-token) för att ändra kritiska inställningar.

### Globala status-banderoller
En funktion visar globala status-banderoller överst i applikationen. Dessa banderoller är alltid synliga när respektive läge är aktivt och säkerställer att administratörer och användare är medvetna om systemets status.

- **Maintenance Mode-banderoll**: Visas när systemet är i underhållsläge.
- **RBAC/SSO-banderoll**: Visas när `RBAC_SSO_ENABLED` är satt till `false`, för att varna om att applikationen körs i ett öppet, osäkrat läge.

## 🔄 Rensa och starta om appen (från grunden)

För att helt återställa applikationen till ett rent tillstånd, använd reset-skripten. Dessa skript stoppar och tar bort Docker-containrar, raderar temporära data-mappar (`uploads`, `quarantine`, `testfiles`) och tar bort gamla `.env`-filer.

- **Windows (PowerShell):**
  ```powershell
  ./reset_env.ps1
  ```
- **Linux/macOS (bash):**
  ```bash
  bash ./reset_env.sh
  ```

Efter att ha kört reset-skriptet kan du starta om applikationen från grunden genom att följa stegen i [Getting Started](#2-getting-started).

> **Viktigt:** Reset-skripten ger en komplett återställning. Använd dem när du vill säkerställa att ingen gammal data eller konfiguration finns kvar.

## 🛠️ Portabel och själviniterande applikation

- cfiles är nu helt portabel och kan startas på valfri dator (Windows, Linux, macOS) utan manuell konfiguration.
- Init-script (`init_env.ps1` för Windows, `init_env.sh` för Linux/macOS) skapar automatiskt alla nödvändiga miljövariabler och .env-filer vid första uppstart.
- Alla tjänster (backend, frontend, RabbitMQ, Postgres, ClamAV) startas och konfigureras automatiskt via Docker Compose.
- Backend skapar automatiskt mappar och initierar systeminställningar i databasen vid start.
- Ingen manuell redigering av miljövariabler krävs – allt sätts automatiskt och kan ändras i efterhand om så önskas.
- Dokumentationen är uppdaterad med tydliga steg för att rensa och starta om appen från grunden.

> **Resultat:** cfiles är robust, modulär, lätt att flytta och starta om – och alltid enkel att sätta upp i nya miljöer.

## 🐞 Felsökningsplan: RabbitMQ-anslutning och filuppladdning

1. **Verifiera RabbitMQ-host**
   - Om backend och RabbitMQ körs i Docker Compose: sätt `RABBITMQ_HOST=rabbitmq` i `.env`.
   - Om backend körs lokalt och RabbitMQ i Docker: använd `RABBITMQ_HOST=localhost` och exponera port 5672.

2. **Kontrollera användarnamn/lösenord**
   - Säkerställ att `RABBITMQ_DEFAULT_USER` och `RABBITMQ_DEFAULT_PASS` i `.env` matchar RabbitMQ-instansen i `docker-compose.yml`.

3. **Starta om alla tjänster**
   - Kör:
     ```bash
     docker compose down
     docker compose up -d --build
     ```

4. **Verifiera RabbitMQ och nätverk**
   - Kontrollera att RabbitMQ är igång:
     ```bash
     docker compose logs rabbitmq --tail=50
     ```
   - Kontrollera att backend-containern kan nå RabbitMQ:
     ```bash
     docker compose exec backend ping rabbitmq
     ```

5. **Testa filuppladdning**
   - Ladda upp en fil via frontend eller med curl.
   - Om det fortfarande inte fungerar, kontrollera backend-loggen och notera exakt felmeddelande.

6. **Om felet kvarstår**
   - Visa `.env` (utan lösenord) och `docker-compose.yml` för dubbelkoll.
   - Kontrollera att ingen brandvägg eller portblockering finns mellan backend och RabbitMQ.

> **Mål:** Säkerställa robust och portabel RabbitMQ-anslutning för filuppladdning i alla miljöer.

---

## Kör Projektet med Docker

Applikationen är helt container-baserad och körs med Docker Compose. Detta säkerställer att alla tjänster (backend, frontend, worker, databas) startas med rätt konfiguration.

1.  **Förbered Miljöfilen:**
    Kör lämpligt skript för ditt operativsystem för att skapa en `.env`-fil med standardvärden. Denna fil innehåller alla nödvändiga miljövariabler.
    -   **Windows (PowerShell):**
        ```powershell
        .\init_env.ps1
        ```
    -   **Linux/macOS (bash/zsh):**
        ```bash
        ./init_env.sh
        ```

2.  **Bygg och Starta Containers:**
    Använd `docker-compose` för att bygga och starta alla tjänster i bakgrunden. Kommandot `--build` är viktigt eftersom det bygger om images om koden (t.ex. i `frontend` eller `backend`) har ändrats.

    ```bash
    docker-compose up -d --build
    ```

3.  **Applikationen är nu tillgänglig:**
    -   **Frontend:** [http://localhost:3000](http://localhost:3000)
    -   **Backend API:** [http://localhost:8000/docs](http://localhost:8000/docs)

4.  **Stänga Ner:**
    För att stoppa alla containers, kör:
    ```bash
    docker-compose down
    ```

## Development

This project includes a fully containerized development environment using Docker.

### Miljövariabler
Projektet konfigureras via en `.env`-fil i rotmappen. Följande variabler används:

| Variabel             | Beskrivning                                                                                                | Exempelvärde            |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------- |
| `POSTGRES_USER`      | Användarnamn för PostgreSQL-databasen.                                                                     | `cfiles`                |
| `POSTGRES_PASSWORD`  | Lösenord för PostgreSQL-databasen.                                                                         | `supersecretpassword`   |
| `POSTGRES_DB`        | Namnet på PostgreSQL-databasen.                                                                            | `cfilesdb`              |
| `RABBITMQ_DEFAULT_USER` | Användarnamn för RabbitMQ.                                                                                 | `user`                  |
| `RABBITMQ_DEFAULT_PASS` | Lösenord för RabbitMQ.                                                                                     | `password`              |
| `RABBITMQ_HOST`      | Värdnamnet för RabbitMQ-tjänsten, vanligtvis containernamnet.                                              | `rabbitmq`              |
| `REACT_APP_API_URL`  | URL till backend-API:et för frontend.                                                                      | `http://localhost:8000` |
| `REACT_APP_WS_URL`   | WebSocket-URL för statusuppdateringar.                                                                     | `ws://localhost:8000/ws/status` |
| `RBAC_SSO_ENABLED`   | Styr om RBAC/SSO-autentisering är aktiv. Sätt till `false` för att köra i öppet utvecklingsläge.            | `true` / `false`        |

## Proxy (Traefik/Nginx)

> Reverse proxy används inte i nuvarande arkitektur, men är planerat som ett framtida utvecklingsområde. När proxy införs kommer den vara utbytbar (Traefik/Nginx) och scriptstyrd enligt projektets riktlinjer. Se ARCHITECTURE.md och PROJECT.md för status.
