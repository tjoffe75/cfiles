
# 📚 Komplett Applikationsarkitektur – FILES (Uppdaterad 2025-06-24)

---

## 🚀 Syfte och Funktionalitet

Applikationen erbjuder:

* Uppladdning av filer för virus- och checksum-skanning.
* Karantänfunktion för skadliga filer (delvis implementerad).
* Nedladdning av skanningsresultat via API.
* Adminpanel med konfigurationshantering, loggläsare och dynamisk logotyp.
* Integration mot on-premise Active Directory (SSO och RBAC).
* Dockerbaserad distribuerbarhet med horisontell skalbarhet.
* Workers för asynkrona skanningar med RabbitMQ.

---

## 📌 Arkitekturöversikt

### Frontend (React + Vite)

- Modern, intuitiv UI med TypeScript och Vite.
- Dynamisk logotyp som kan laddas upp via adminpanelen och visas globalt.
- Komponenter för filuppladdning, skanningsresultat, loggläsare, karantänhantering, RBAC/SSO och maintenance-läge.
- Dockeriserad med Node 20 Alpine.

### Backend API (FastAPI)

- JWT-autentiserat RESTful API med OpenID Connect mot on-prem AD.
- Endpoints för filuppladdning, hämtning av skanningsresultat, adminfunktioner.
- RabbitMQ-integrerad för asynkrona jobb.
- Databas (PostgreSQL) hanterar metadata, status, konfiguration och skanningsresultat.
- Alembic migreringsverktyg med komplett migrationskonfiguration.
- Dockeriserad Python 3.11-miljö.

### Workers (Python)

- Virus-worker:
  - Integrerad med ClamAV för virus-skanning via `clamscan`.
  - Konsumerar RabbitMQ-jobb, utför skanning och sparar resultat i DB.
- Checksum-worker:
  - Beräknar SHA256 checksum av filer.
  - Sparar resultat i DB.
- (Optional: Secondary-scan-worker kan tilläggas i framtiden).

### Meddelandekö (RabbitMQ)

- Köhantering för asynkron jobbkörning.
- Klustring och skalbarhet planerad.

### Databas (PostgreSQL)

- Tabell `scans` lagrar filmetadata, status, virus- och checksum-resultat.
- Tabell `admin_config` lagrar systeminställningar (ex. maintenance, RBAC/SSO-konfiguration).
- Stöd för replikering och skalbarhet.

### Logghantering

- Backend loggar applikationshändelser.
- Loggläsare i adminpanelen med filtrering och realtidsuppdatering.
- Integration med Elastic Stack planerad.

---

## 🖥 Adminpanel och Konfigurationshantering

- Maintenance mode (ON/OFF) med blockering av normal användaråtkomst och anpassat meddelande.
- RBAC/SSO (ON/OFF) med integration mot on-prem AD via OpenID Connect.
- Hantering av karantänstatus på filer (granska, frigöra, radera).
- Uppladdning och hantering av dynamisk logotyp.
- Loggläsare för backend-loggar.
- HTTPS-certifikathantering och AD-integration (delvis implementerat, vidare arbete planeras).

---

## 🔐 SSO och RBAC-funktion

- **ON:** Autentisering mot on-prem AD via OpenID Connect.
- Rollbaserad åtkomst med grupper `Users` och `Admin`.
- JWT-token genereras från AD:s `id_token`.
- **OFF:** Fri åtkomst med global varning i UI.
- Fallback i backend för dev-läge utan SSO.

---

## 📁 Karantänfunktion

- Filer med skadliga upptäckter markeras som karantän.
- Admin kan hantera karantän via UI.
- Backend-API stöder karantänstatus och åtgärder (delvis implementerat).

---

## 📄 Loggläsare

- Realtidsvisning och filtrering av applikationsloggar.
- Backend-endpoint `/admin/logs` skyddad med RBAC.
- Färgkodning och paginering i frontend.

---

## 🔗 Integrationsstrategi

- RESTful API externt och internt.
- OpenID Connect mot on-prem AD.
- RabbitMQ för intern köhantering.
- Planerad Elastic Stack-integration för logg och övervakning.

---

## 🛡 Säkerhetsstrategi

- JWT-autentisering och RBAC med AD-grupper.
- Krypterad lagring av känsliga data.
- HTTPS via adminpanel.
- Säkra tokens och sessioner.
- Underhållsläge för säker drift.

---

## 📈 Prestanda och Skalbarhet

- Docker Compose/Kubernetes för skalbarhet.
- RabbitMQ-klustring.
- Databasreplikering/sharding.
- Asynkrona workers för belastningsavlastning.

---

## 🔄 Drift, CI/CD och Övervakning

- GitHub Actions-pipelines för CI/CD (planerat).
- Prometheus/Grafana och Elastic Stack för övervakning och logghantering (planerat).
- Docker-baserad deployment.

---

## 📜 Databasstruktur (viktigaste tabellen)

```sql
CREATE TABLE scans (
  id UUID PRIMARY KEY,
  filename TEXT NOT NULL,
  status TEXT,
  virus_result JSONB,
  checksum_results JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE admin_config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🎯 Informationsflöden

### Normal drift:

```
Användare → AD (SSO) → API → RabbitMQ → Workers → DB → Resultat
```

### Maintenance mode ON:

```
Användare → Blockerad → Underhållsmeddelande
```

### RBAC/SSO OFF:

```
Alla → Fri åtkomst med global varning
```

---

## 🗂️ Applikationens huvudkomponenter — Flödesschema

```plaintext
+--------------+         +-----------+         +--------------+
|  Frontend    | <-----> |  Backend  | <-----> |  PostgreSQL  |
| (React/Vite) |         | (FastAPI) |         |   Database   |
+--------------+         +-----------+         +--------------+
       |                       |                      ^
       |                       |                      |
       v                       v                      |
+----------------+      +-------------+               |
| RabbitMQ Queues| <--> |  Workers    | --------------+
| (virus/checksum)|      | (Python)    |
+----------------+      +-------------+
```

---

## 🛤️ Filens resa genom systemet — Flödesschema

```plaintext
[Användare]
     |
     v
[Frontend]
  (Filuppladdning)
     |
     v
[Backend API]
  (Tar emot fil, sparar temporärt)
     |
     v
[RabbitMQ]
  (Skickar jobb till virus- och checksum-worker)
     |
     v
[Workers]
  (Skanning av virus & beräkning av checksum)
     |
     v
[PostgreSQL]
  (Sparar skanningsresultat & status)
     |
     v
[Backend API]
  (Hämtar resultat för användare)
     |
     v
[Frontend]
  (Visar resultat för användaren)
```

---

## 🚩 Implementerat hittills

- Backend med FastAPI, JWT och OpenID Connect (on-prem AD)
- RabbitMQ-integrering och jobbköer
- Filuppladdning och jobbsändning till workers
- Virus-worker med ClamAV-skanning och lagring i DB
- Checksum-worker med SHA256 och lagring i DB
- API för hämtning av skanningsresultat
- Frontend med React + Vite, inkl. upload, loggläsare, karantänhantering och dynamisk logotyp
- Adminpanel med RBAC, maintenance-mode och loggläsare
- Alembic migreringsstöd och databasstruktur
- Docker Compose konfiguration för hela stacken

---

## ⏳ Kvar att implementera

- Fullständig karantänfunktion i backend och UI (frisläpp/radering)
- HTTPS och certifikathantering via adminpanelen
- Fullständig AD-grupphantering och RBAC-automation
- Elastic Stack-integration för logg och övervakning
- CI/CD-pipelines (GitHub Actions)
- Övervakning och metrics (Prometheus/Grafana)
- Secondary scan-worker (valfri utökning)
- Omfattande enhetstester och integrationstester
- Dokumentation för användare och admin
