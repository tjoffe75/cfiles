# FILES - Filhanteringsapplikation

## 🚀 Syfte

En robust applikation för säker filuppladdning, där varje fil automatiskt skickas till en separat process för virusskanning. Systemet är byggt med en skalbar mikroarkitektur som använder en meddelandekö för att hantera asynkrona jobb.

## ✅ Nuvarande Status: Karantänfunktion Implementerad

Projektet har nu ett komplett end-to-end-flöde för säker filuppladdning, asynkron virusskanning och hantering av infekterade filer.

**Vad som är implementerat och fungerar:**
*   **Backend API (`/config/upload/`)**: Tar emot filuppladdningar och sparar filinformation i **PostgreSQL**-databasen med status `PENDING`.
*   **Asynkron bearbetning**: Ett meddelande med fil-ID publiceras till **RabbitMQ**.
*   **Worker & Skanning**: En worker tar emot jobbet, uppdaterar status till `SCANNING`, och skannar filen med **ClamAV**.
*   **Databasintegration**: Worker uppdaterar filens status (`CLEAN`, `INFECTED`, `ERROR`) och eventuella detaljer i databasen efter skanning.
*   **🛡️ Karantänfunktion**: Infekterade filer flyttas automatiskt till en skyddad `/quarantine`-katalog. Sökvägen i databasen uppdateras för att reflektera den nya platsen. Systemet hanterar namnkonflikter genom att ge duplicerade filer unika namn.
*   **Status-endpoint (`/config/files/`)**: En ny endpoint som visar status för alla uppladdade filer direkt från databasen.
*   **Robusthet**: `Retry`-logik för anslutningar till både RabbitMQ, ClamAV och PostgreSQL gör systemet tåligt mot uppstartsrace och tillfälliga avbrott.

## 🛡️ Karantänfunktion

När en fil identifieras som `INFECTED` av ClamAV, sker följande automatiskt:

1.  **Flytt**: Filen flyttas från den temporära uppladdningskatalogen (`/uploads`) till en isolerad karantänkatalog (`/quarantine`). Båda dessa är Docker-volymer för att bestå data.
2.  **Namngivning**: Om en fil med samma namn redan finns i karantänen, får den nya filen ett unikt namn (t.ex. `infected_file_1.txt`, `infected_file_2.txt`) för att undvika konflikter.
3.  **Databasuppdatering**: Filens status i databasen sätts till `INFECTED`, och dess `filepath` uppdateras till den nya sökvägen i karantänmappen.

Detta säkerställer att skadliga filer omedelbart isoleras och att systemet har full spårbarhet.

## 🛠️ Teknisk Arkitektur

*   **Backend API (FastAPI):** Hanterar filuppladdning, databasinteraktioner och publicerar jobb till kön.
*   **Meddelandekö (RabbitMQ):** Fullt fungerande. Använder kön `file_queue`.
*   **Worker (Python):** Prenumererar på `file_queue`, hanterar skanning, databasuppdateringar och karantänlogik.
*   **Virusskanner (ClamAV):** Körs som en nätverkstjänst.
*   **Databas (PostgreSQL):** Fullt integrerad. Lagrar filinformation, status och sökvägar.

## 🏁 Komma igång & Testa

1.  **Förutsättningar:** Docker och Docker Compose måste vara installerade.
2.  **Skapa testfiler:**
    *   Skapa en ofarlig fil: `echo "detta är en säker fil" > safe_file.txt`
    *   Skapa en EICAR-testfil för att simulera ett virus:
        ```bash
        echo 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > eicar_test.txt
        ```
3.  **Bygg och starta:**
    ```bash
    docker compose up -d --build
    ```
4.  **Ladda upp filerna:**
    ```bash
    # Ladda upp den säkra filen
    curl -X POST -F "file=@safe_file.txt" http://localhost:8000/config/upload/

    # Ladda upp den infekterade filen (gärna flera gånger för att testa karantänlogiken)
    curl -X POST -F "file=@eicar_test.txt" http://localhost:8000/config/upload/
    curl -X POST -F "file=@eicar_test.txt" http://localhost:8000/config/upload/
    ```
5.  **Verifiera flödet:**
    *   Kontrollera loggarna från workern: `docker compose logs workers`
    *   Kontrollera status för alla filer via API:et: `curl http://localhost:8000/config/files/`
    *   Inspektera karantänmappen: `docker compose exec backend ls /quarantine`

## 🗺️ Projekt-Roadmap (Resterande Vision)

Följande funktioner från den ursprungliga arkitekturen återstår att implementera:

*   **Fullt utbyggt Frontend:**
    *   Användargränssnitt för uppladdning och visning av resultat.
    *   Adminpanel för att hantera karantän.
*   **Utökade Workers:**
    *   Checksum-worker.
*   **Adminpanel & Konfigurationshantering:**
    *   Maintenance mode, SSO/RBAC, loggläsare, certifikathantering etc.
*   **Säkerhet:**
    *   JWT-autentisering och RBAC.
