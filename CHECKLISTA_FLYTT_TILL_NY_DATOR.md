# Checklista: Flytta och starta Filesapp på ny dator (Windows)

> **Nyhet 2025:**
> - Gränssnittet är nu modernt och responsivt med centrerad titel och logotyp i vänstra hörnet.
> - Dark mode-toggle är alltid synlig i top-baren.
> - Logotypen kan bytas ut genom att ersätta `frontend/public/logo-placeholder.svg`.

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
   ```powershell
   ./init_env.ps1
   ```
   - Scriptet skapar `.env` och `frontend\.env` med slumpade RabbitMQ-värden om de inte redan finns.
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

Om du vill börja om från början och rensa bort alla filer, databaser och containrar:

1. **Stoppa och ta bort alla Docker-containrar**
   ```powershell
   docker compose down
   ```
2. **Ta bort alla genererade mappar och filer**
   ```powershell
   Remove-Item -Recurse -Force .\uploads, .\quarantine, .\testfiles, .env, .\frontend\.env
   ```
   (eller radera dem manuellt i Utforskaren)
3. **Ta bort extra filer i projektmappen**
   - Kontrollera om det finns oönskade filer som t.ex. `.zip`-arkiv eller gamla backup-filer i projektmappen och ta bort dem.
   - Exempel för att ta bort alla zip-filer:
     ```powershell
     Remove-Item -Force .\*.zip
     ```
   - Kontrollera även manuellt i Utforskaren att inga extra filer ligger kvar.
4. **Ta bort Docker-volymer (t.ex. för Postgres-data)**
   ```powershell
   docker volume rm filesapp_postgres-data
   ```
   (eller kör `docker volume ls` och ta bort rätt volym)
5. **Skapa nya miljövariabler**
   ```powershell
   ./init_env.ps1
   ```
6. **Bygg och starta om allt**
   ```powershell
   docker compose build
   docker compose up -d
   ```
7. **(Valfritt) Installera frontend-beroenden om du kör utanför Docker**
   ```powershell
   cd frontend
   npm install
   npm start
   ```

Nu har du en helt ren app – inga gamla filer, ingen gammal databas, och alla miljövariabler är nyskapade!

---

## How to reset the app to a completely clean state (English)

If you want to start over and remove all files, databases, and containers:

1. **Stop and remove all Docker containers**
   ```powershell
   docker compose down
   ```
2. **Delete all generated folders and files**
   ```powershell
   Remove-Item -Recurse -Force .\uploads, .\quarantine, .\testfiles, .env, .\frontend\.env
   ```
   (or delete them manually in File Explorer)
3. **Remove extra files in the project folder**
   - Check if there are any unwanted files such as `.zip` archives or old backup files in the project folder and delete them.
   - Example to remove all zip files:
     ```powershell
     Remove-Item -Force .\*.zip
     ```
   - Also check manually in File Explorer that no extra files remain.
4. **Remove Docker volumes (e.g. for Postgres data)**
   ```powershell
   docker volume rm filesapp_postgres-data
   ```
   (or run `docker volume ls` and remove the correct volume)
5. **Create new environment variables**
   ```powershell
   ./init_env.ps1
   ```
6. **Rebuild and restart everything**
   ```powershell
   docker compose build
   docker compose up -d
   ```
7. **(Optional) Install frontend dependencies if running outside Docker**
   ```powershell
   cd frontend
   npm install
   npm start
   ```

Now you have a completely clean app – no old files, no old database, and all environment variables are newly created!

---

> **Viktigt om filhantering och Docker:**
> 
> Alla filer som laddas upp eller hanteras av appen sparas i mapparna `uploads`, `quarantine` och `testfiles` i projektmappen. Dessa mappar är mappade direkt till containrarna via `docker-compose.yml` (t.ex. `./uploads:/uploads`).
> 
> Det betyder att filerna alltid lagras på din dator och inte i containerns interna lagring. På så sätt riskerar du inte att containern blir full, och du kan enkelt säkerhetskopiera eller flytta filerna vid behov.
> 
> Om du vill ändra var filerna lagras, justera mappningen i `docker-compose.yml`.
