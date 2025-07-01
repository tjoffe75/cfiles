# cfiles - Secure File Upload & Scan

A robust application for secure file uploads, where each file is automatically sent to a separate process for virus scanning. Built with a scalable microservice architecture.

For a detailed project overview, see [PROJECT.md](PROJECT.md).
For a deep dive into the technical implementation, see [ARCHITECTURE.md](ARCHITECTURE.md).

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

**Installation & Running:**

1.  **Clone the repository:**
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

## 🔄 Rensa och starta om appen (från grunden)

Följ dessa steg för att rensa miljön och starta om Filesapp på en ny, ren instans:

1. **Stoppa alla tjänster**
   - Stäng av backend, frontend och eventuella Docker-containrar (RabbitMQ, Postgres).

2. **Rensa gamla data och miljö**
   - Ta bort mapparna: `uploads`, `quarantine`, `testfiles` (de skapas automatiskt vid backend-start).
   - Ta bort eller flytta `.env` och `frontend/.env` om du vill ha nya credentials.

3. **Initiera miljövariabler**
   - Kör init-scriptet:
     - Windows: `./init_env.ps1`
     - Linux/macOS: `bash ./init_env.sh`
   - Detta skapar `.env` och `frontend/.env` med rätt RabbitMQ, Postgres och WebSocket-URL samt sätter `RABBITMQ_HOST=rabbitmq` för Docker Compose.

4. **Starta tjänster**
   - Starta RabbitMQ och Postgres (t.ex. via Docker Compose eller motsvarande).
   - Starta backend (t.ex. med `uvicorn backend.main:app --reload`).
     - Backend skapar automatiskt mappar och initierar systeminställningar i databasen.
   - Starta frontend (i `frontend/`):
     - `npm install` (vid behov)
     - `npm start`

5. **Testa funktionalitet**
   - Öppna frontend på http://localhost:3000.
   - Testa drag-and-drop och vanlig uppladdning.
   - Kontrollera att dark mode, adminpanel och maintenance mode fungerar.
   - Kontrollera att statusmeddelanden och eventuella felmeddelanden visas korrekt.

> **Tips:** Du behöver inte manuellt skapa mappar eller systeminställningar – backend gör detta automatiskt.

## 🛠️ Portabel och själviniterande applikation

- Filesapp är nu helt portabel och kan startas på valfri dator (Windows, Linux, macOS) utan manuell konfiguration.
- Init-script (`init_env.ps1` för Windows, `init_env.sh` för Linux/macOS) skapar automatiskt alla nödvändiga miljövariabler och .env-filer vid första uppstart.
- Alla tjänster (backend, frontend, RabbitMQ, Postgres, ClamAV) startas och konfigureras automatiskt via Docker Compose.
- Backend skapar automatiskt mappar och initierar systeminställningar i databasen vid start.
- Ingen manuell redigering av miljövariabler krävs – allt sätts automatiskt och kan ändras i efterhand om så önskas.
- Dokumentationen är uppdaterad med tydliga steg för att rensa och starta om appen från grunden.

> **Resultat:** Filesapp är robust, modulär, lätt att flytta och starta om – och alltid enkel att sätta upp i nya miljöer.

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
