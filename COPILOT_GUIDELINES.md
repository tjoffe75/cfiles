# Riktlinjer för Copilot

Detta dokument innehåller de specifika instruktioner och regler som du, Copilot, måste följa när du arbetar i detta projekt. Läs och följ dessa regler vid varje interaktion.

---

## 1. Start, Stopp och Återställning av Miljön

Använd **alltid** de fördefinierade skripten för att hantera utvecklingsmiljön. Kör aldrig kommandon som `docker-compose`, `npm` eller `python` manuellt om det finns ett skript.

- **För att starta/bygga om hela miljön från grunden:**
  - Kör `.\reset_env.ps1` (för Windows).
  - Detta skript rensar Docker-containrar, volymer, nätverk och bygger om allt.

- **För att starta frontend och backend:**
  - Använd de specifika startskripten om de finns. Om inte, följ instruktionerna i `README.md`.

- **För att stoppa miljön:**
  - Kör `docker-compose down`.

## 2. Obligatorisk Läsning

Innan du gör några ändringar eller skriver ny kod, måste du ha en uppdaterad förståelse för projektets arkitektur och mål. Läs följande filer:

1.  **`PROJECT.md`**: För att förstå projektets övergripande riktlinjer, nuvarande status och vision.
2.  **`ARCHITECTURE.md`**: För att förstå den tekniska arkitekturen, systemflöden och databasdesign.
3.  **`README.md`**: För praktiska instruktioner om installation och körning.
4.  **`COPILOT_GUIDELINES.md`** (denna fil): För att påminna dig om reglerna.

## 3. Kärnprinciper vid Kodning

Följ dessa principer strikt:

1.  **Inget får gå sönder:** Existerande funktionalitet måste fortsätta fungera.
2.  **Modularitet:** Skriv återanvändbar, väldokumenterad och modulär kod. Undvik hårdkodning och duplicering.
3.  **Robusthet:** Implementera solid felhantering för alla operationer (API-anrop, filhantering, etc.).
4.  **Följ UI-designen:** Håll dig till den moderna och konsekventa design som definieras i projektet.

## 4. Specifika Regler och Förbud

- **Använd "devuser":** När `RBAC_SSO_ENABLED=false`, förlita dig på att backend använder "devuser" för alla anrop. Skicka inga `Authorization`-headers i detta läge.
- **Inga manuella installationer:** Använd inte `npm install` eller `pip install` direkt. Om beroenden behöver läggas till, uppdatera `package.json` eller `requirements.txt` och låt de befintliga byggskripten hantera installationen.
- **Dokumentera ändringar:** Om du gör en betydande ändring, se till att relevant dokumentation (`README.md`, etc.) uppdateras.

## Exempel på commit-meddelanden

- feat: Lägg till stöd för scriptstyrd proxy-växling
- fix: Åtgärda CORS-problem i Nginx-konfiguration
- docs: Uppdatera README med Quick Start
- refactor: Dela upp worker-logik i mindre funktioner

## Vanliga misstag att undvika

- Kör aldrig `npm install` eller `pip install` manuellt – använd alltid projektets script och Docker.
- Byt proxy endast via script när proxy är implementerad (gäller framtida utveckling).
- Proxy (Traefik/Nginx) används inte i nuvarande arkitektur – se ARCHITECTURE.md och PROJECT.md för status.
- SSO/RBAC och Maintenance Mode är fullt implementerat och styrs via adminpanelen och miljövariabler. Statusbanderoller visas alltid i UI.
- Glöm inte att uppdatera dokumentation vid större ändringar.
- Skapa aldrig feature-bransch direkt från en annan feature-bransch – utgå alltid från main.

## Dokumentationskrav

- Vid större ändringar ska alltid README.md, PROJECT.md och/eller ARCHITECTURE.md uppdateras så att de speglar aktuell funktionalitet och arbetsflöde.
