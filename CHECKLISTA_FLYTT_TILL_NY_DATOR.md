# Checklista: Flytta och starta Filesapp på ny dator (Windows)

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

> Alla nödvändiga mappar skapas nu automatiskt vid start. Om något saknas eller inte fungerar: kontrollera att alla ovanstående punkter är uppfyllda och att inga viktiga filer är ignorerade i `.gitignore`.
