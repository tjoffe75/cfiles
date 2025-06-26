# FILES - Filhanteringsapplikation

## 🚀 Syfte

En robust applikation för säker filuppladdning, där varje fil automatiskt skickas till en separat process för virusskanning. Systemet är byggt med en skalbar mikroarkitektur som använder en meddelandekö för att hantera asynkrona jobb.

## ✅ Nuvarande Status: Proof of Concept (PoC) Avklarat

Projektet har framgångsrikt uppnått ett **Proof of Concept** för den mest kritiska delen av systemet: **den asynkrona skanningsprocessen**.

**Vad som är implementerat och fungerar:**
*   En komplett Docker Compose-miljö med alla nödvändiga tjänster.
*   En **Worker**-process som på ett robust sätt ansluter till **RabbitMQ**.
*   Workern tar emot filvägar från en kö, anropar **ClamAV** för skanning och loggar resultatet.
*   Manuell meddelandekvittens (`ack/nack`) för att garantera att inga jobb tappas bort.
*   En delad volym mellan worker och ClamAV för att filåtkomst ska fungera.
*   Hela kedjan är testad och verifierad: från att ett meddelande publiceras i kön till att filen skannas och resultatet loggas.

Detta utgör en stabil grund att bygga vidare på.

## 🛠️ Teknisk Arkitektur (för nuvarande PoC)

*   **Backend API (FastAPI):** Embryo. Finns som en tjänst, men saknar implementation för filuppladdning.
*   **Meddelandekö (RabbitMQ):** Fullt fungerande. Använder kön `file_queue`.
*   **Worker (Python):** Fullt fungerande. Prenumererar på `file_queue`, hanterar jobb och anropar ClamAV.
*   **Virusskanner (ClamAV):** Fullt fungerande. Körs som en nätverkstjänst.
*   **Databas (PostgreSQL):** Embryo. Finns som en tjänst men är inte integrerad.

## 🏁 Komma igång & Testa PoC

1.  **Förutsättningar:** Docker och Docker Compose måste vara installerade.
2.  **Bygg och starta:**
    ```bash
    docker compose build
    docker compose up -d
    ```
3.  **Verifiera flödet:**
    *   Skapa en testfil i mappen `./testfiles`, t.ex. `test.txt`.
    *   Publicera ett meddelande för att simulera en filuppladdning från backend:
        ```bash
        docker exec -it cfiles-rabbitmq-1 rabbitmqadmin publish routing_key=file_queue payload="/files/test.txt"
        ```
    *   Kontrollera loggarna från workern:
        ```bash
        docker compose logs workers
        ```

## 🗺️ Projekt-Roadmap (Resterande Vision)

Följande funktioner från den ursprungliga arkitekturen återstår att implementera:

*   **Backend API-implementation:**
    *   Endpoint för att ta emot filuppladdningar.
    *   Spara filen till den delade volymen.
    *   Publicera meddelande till RabbitMQ.
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
