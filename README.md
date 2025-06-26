# FILES - Filhanteringsapplikation

## 🚀 Syfte

En robust applikation för säker filuppladdning, där varje fil automatiskt skickas till en separat process för virusskanning. Systemet är byggt med en skalbar mikroarkitektur som använder en meddelandekö för att hantera asynkrona jobb.

## ✅ Nuvarande Status: Backend-integration Avklarad

Projektet har framgångsrikt implementerat och verifierat **hela kedjan för filuppladdning och asynkron skanning**.

**Vad som är implementerat och fungerar:**
*   **Backend API (`/config/upload/`)** som tar emot filuppladdningar via HTTP POST.
*   Filen sparas på en **delad volym** som är tillgänglig för alla relevanta tjänster.
*   Ett meddelande med filens sökväg publiceras till **RabbitMQ**.
*   En **Worker**-process tar emot jobbet, hittar filen och anropar **ClamAV** för skanning.
*   **Robust anslutningshantering** med `retry`-logik för både RabbitMQ och ClamAV, vilket gör systemet tåligt mot uppstartsrace.
*   Manuell meddelandekvittens (`ack/nack`) för att garantera att inga jobb tappas bort.
*   Hela flödet är verifierat: `curl` -> `backend` -> `rabbitmq` -> `worker` -> `clamav`.

Detta utgör en stabil och komplett grund för vidareutveckling.

## 🛠️ Teknisk Arkitektur

*   **Backend API (FastAPI):** Grundläggande implementation klar. Har en endpoint för filuppladdning och publicerar jobb till kön.
*   **Meddelandekö (RabbitMQ):** Fullt fungerande. Använder kön `file_queue`.
*   **Worker (Python):** Fullt fungerande. Prenumererar på `file_queue`, hanterar jobb och anropar ClamAV.
*   **Virusskanner (ClamAV):** Fullt fungerande. Körs som en nätverkstjänst.
*   **Databas (PostgreSQL):** Embryo. Finns som en tjänst men är inte integrerad.

## 🏁 Komma igång & Testa

1.  **Förutsättningar:** Docker och Docker Compose måste vara installerade.
2.  **Bygg och starta:**
    ```bash
    docker compose up -d --build
    ```
3.  **Verifiera flödet:**
    *   Skapa en lokal testfil, t.ex. `min_testfil.txt`.
    *   Ladda upp filen till backend-tjänsten med `curl`:
        ```bash
        # Ersätt 'min_testfil.txt' med sökvägen till din fil
        curl -X POST -F "file=@min_testfil.txt" http://localhost:8000/config/upload/
        ```
    *   Kontrollera loggarna från workern för att se hela processen:
        ```bash
        docker compose logs workers
        ```

## 🗺️ Projekt-Roadmap (Resterande Vision)

Följande funktioner från den ursprungliga arkitekturen återstår att implementera:

*   **Backend API-implementation (Forts.):**
    *   Spara skanningsresultat och fil-metadata till databasen.
    *   Exponera endpoints för att hämta status/resultat.
*   **Fullt utbyggt Frontend:**
    *   Användargränssnitt för uppladdning och visning av resultat.
    *   Adminpanel.
*   **Databasintegration (PostgreSQL):**
    *   Lagra metadata om filer, skanningsresultat, karantänstatus etc.
*   **Utökade Workers:**
    *   Checksum-worker.
*   **Karantänfunktion:**
    *   Logik i workern för att hantera infekterade filer (t.ex. flytta till karantän-mapp).
    *   API-endpoints och UI i adminpanelen för att hantera karantän.
*   **Adminpanel & Konfigurationshantering:**
    *   Maintenance mode, SSO/RBAC, loggläsare, certifikathantering etc.
*   **Säkerhet:**
    *   JWT-autentisering och RBAC.
