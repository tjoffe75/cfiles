# Checklista: Flytta och starta cfiles på ny dator (Windows/Linux)

> **Nyhet 2025:**
> - Gränssnittet är nu modernt och responsivt med centrerad titel och logotyp i vänstra hörnet.
> - Dark mode-toggle är alltid synlig i top-baren.
> - Logotypen kan bytas ut genom att ersätta `frontend/public/logo-placeholder.svg`.
> - **Miljöfiler skapas nu automatiskt på både Windows (init_env.ps1) och Linux/macOS (init_env.sh).**

1. **Installera förutsättningar**
   - [Git](https://git-scm.com/download/win)
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - (Valfritt) [Node.js LTS](https://nodejs.org/) om du vill köra frontend utanför Docker

2. **Klona repot från GitHub**
   ```powershell
   git clone <repo-url>
   cd cfiles
   ```

3. **Skapa miljövariabler automatiskt**
   - På **Windows** (PowerShell):
     ```powershell
     ./init_env.ps1
     ```
   - På **Linux/macOS** (bash):
     ```bash
     bash init_env.sh
     ```
   - Scriptet skapar `.env` och `frontend\.env` med slumpade RabbitMQ- och Postgres-värden om de inte redan finns.
   - Öppna `.env` och `frontend\.env` i valfri editor om du vill ändra något.

4. **Bygg och starta med Docker**
   ```powershell
   docker compose build
   docker compose up -d
   ```
   - Kontrollera att `pyjwt` är med i `backend/requirements.txt` (ska redan vara tillagt).
   - Om du lagt till nya Python-paket (t.ex. `pyjwt`):
     ```powershell
     docker compose build backend
     docker compose up -d backend
     ```
   - Detta säkerställer att backend har alla nya beroenden.

5. **Verifiera att allt fungerar**
   - Kolla loggar vid behov:
     ```powershell
     docker compose logs
     ```
   - Öppna i webbläsare:
     - Backend: http://localhost:8000/docs
     - Frontend: http://localhost:3000

6. **(Endast om du vill köra frontend utanför Docker)**
   ```powershell
   cd frontend
   npm install
   npm start
   ```

7. **Testa filuppladdning och scanning**
   - Ladda upp en fil via frontend och kontrollera att status uppdateras.

8. **Läs README.md för mer info och felsökningstips**

---

## Starta om från en helt ren app

Om du vill börja om från början och rensa bort alla filer, databaser och containrar, använd de färdiga reset-skripten. Dessa skript automatiserar hela processen.

- **Windows (PowerShell):**
  ```powershell
  ./reset_env.ps1
  ```
- **Linux/macOS (bash):**
  ```bash
  bash ./reset_env.sh
  ```

Skripten kommer att:
1. Stoppa och ta bort alla Docker-containrar och volymer.
2. Radera mapparna `uploads`, `quarantine`, och `testfiles`.
3. Ta bort `.env`-filerna.
4. Köra `init_env`-skriptet för att skapa nya miljöfiler.
5. Bygga och starta om alla tjänster.

Nu har du en helt ren app – inga gamla filer, ingen gammal databas, och alla miljövariabler är nyskapade!

---

## How to reset the app to a completely clean state (English)

If you want to start over and remove all files, databases, and containers, use the provided reset scripts. These scripts automate the entire process.

- **Windows (PowerShell):**
  ```powershell
  ./reset_env.ps1
  ```
- **Linux/macOS (bash):**
  ```bash
  bash ./reset_env.sh
  ```

The scripts will:
1. Stop and remove all Docker containers and volumes.
2. Delete the `uploads`, `quarantine`, and `testfiles` directories.
3. Remove the `.env` files.
4. Run the `init_env` script to create new environment files.
5. Rebuild and restart all services.

Now you have a completely clean app – no old files, no old database, and all environment variables are newly created!

---

> **Viktigt om filhantering och Docker:**
> 
> Alla filer som laddas upp eller hanteras av appen sparas i mapparna `uploads`, `quarantine` och `testfiles` i projektmappen. Dessa mappar är mappade direkt till containrarna via `docker-compose.yml` (t.ex. `./uploads:/uploads`).
> 
> Det betyder att filerna alltid lagras på din dator och inte i containerns interna lagring. På så sätt riskerar du inte att containern blir full, och du kan enkelt säkerhetskopiera eller flytta filerna vid behov.
> 
> Om du vill ändra var filerna lagras, justera mappningen i `docker-compose.yml`.
