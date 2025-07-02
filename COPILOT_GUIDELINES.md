# Riktlinjer för Copilot

Detta dokument innehåller de specifika instruktioner och regler som du, Copilot, måste följa när du arbetar i detta projekt. Läs och följ dessa regler noggrant vid varje interaktion.

---

## 1. Övergripande Principer

Ditt arbete ska alltid styras av följande kärnprinciper:

1.  **Portabilitet:** All kod och konfiguration måste fungera sömlöst i en Docker-miljö. Inga manuella steg utanför de försedda skripten är tillåtna.
2.  **Stabilitet:** Existerande funktionalitet får aldrig gå sönder. Alla ändringar måste vara bakåtkompatibla eller hanteras genom en tydlig migreringsplan.
3.  **Modularitet:** Skriv återanvändbar, väldokumenterad och modulär kod. Undvik hårdkodning och duplicering.
4.  **Säkerhet:** Följ bästa praxis för säkerhet i både frontend och backend.
5.  **Dokumentation:** Håll all teknisk dokumentation (`README.md`, `ARCHITECTURE.md`, `PROJECT.md`) uppdaterad med dina ändringar.

---

## 2. Hantering av Utvecklingsmiljön

Använd **alltid** de fördefinierade skripten för att hantera miljön.

-   **Starta/Bygg om från grunden:**
    -   Kör `.\reset_env.ps1` (Windows). Detta skript rensar och bygger om hela Docker-miljön. Det är den enda korrekta metoden för att garantera en ren start.

-   **Stoppa miljön:**
    -   Kör `docker-compose down` för att stoppa alla tjänster.

-   **Åtkomst till applikationen:**
    -   Frontend nås via `https://cfiles.localhost`. All trafik dirigeras genom Traefik.
    -   Använd **inte** `localhost` med portnummer (t.ex. `localhost:3000`) för att komma åt applikationen.

---

## 3. Arbetsflöde och Regler

Innan du skriver kod, läs igenom följande filer för att ha full kontext:
1.  `PROJECT.md`
2.  `ARCHITECTURE.md`
3.  `README.md`
4.  `COPILOT_GUIDELINES.md` (denna fil)

### Kodningsregler

-   **Beroenden:** Lägg till nya beroenden i `frontend/package.json` eller `backend/requirements.txt`. Kör **aldrig** `npm install` eller `pip install` manuellt. Bygg om miljön med `reset_env.ps1` för att installera dem korrekt.
-   **API-anrop:** Alla anrop från frontend till backend ska göras med relativa sökvägar (t.ex. `/api/...`). Traefik hanterar routingen.
-   **"devuser":** När `RBAC_SSO_ENABLED=false`, förlita dig på att backend använder "devuser" för autentisering. Skicka inga `Authorization`-headers från frontend i detta läge.
-   **UI-design:** Håll dig strikt till den etablerade moderna, responsiva och konsekventa designen, inklusive mörkt läge.

### Git-arbetsflöde

-   Arbeta alltid i en ny `feature`-gren.
-   Skriv tydliga och koncisa commit-meddelanden.
-   När en funktion är klar, ska den mergas in i `main`-grenen enligt projektets standardprocess.
