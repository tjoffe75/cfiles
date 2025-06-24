# 📚 Komplett Applikationsarkitektur – FILES

## 🚀 Syfte och Funktionalitet

Applikationen erbjuder:

* Uppladdning av filer för virus- och checksum-scanning.
* Karantänfunktion för skadliga filer.
* Nedladdning av skanningsresultat.
* Adminpanel med konfigurationshantering och loggläsare.

## 📌 Arkitekturöversikt

### Frontend (React)

* Användargränssnitt för uppladdning och nedladdning.
* Separat adminpanel.
* Modernt och intuitivt UI för bästa användarupplevelse.

### Backend API (FastAPI)

* JWT-autentiserat RESTful API.
* Horisontell skalbarhet.

### Workers (Python)

* Virus-worker (ClamAV).
* Checksum-worker.
* Optional: Secondary-scan-worker.

### Meddelandekö (RabbitMQ)

* Hantering av asynkrona jobb.

### Databas (PostgreSQL)

* Metadata, karantänstatus, konfigurationsdata.
* Stöd för skalbarhet.

### Logghantering

* Initailt filloggning

## 🖥 Adminpanel och Konfigurationshantering

* Maintenance mode (ON/OFF).
* SSO/RBAC (ON/OFF).
* HTTPS och certifikathantering.
* Integration mot AD.
* Loggläsare för applikationsloggar.
* Hantering av filer i karantän (frigivning eller radering).
* Möjlighet att toggla HTTP/HTTPS via adminpanelen för flexibel konfiguration.
* Möjlighet att ladda upp egna HTTPS-certifikat via adminpanelen för säker konfiguration.
* Möjlighet att ladda upp företagets logotyp via adminpanelen, som sedan visas i alla vyer för enhetlig branding.
* Möjlighet för alla användare och admins att toggla dark mode direkt från användargränssnittet, utan att behöva komma åt adminpanelen.
* Adminpanelen ska ha en översiktsvy för att ge en snabb sammanfattning av systemets status och viktiga händelser.

## 🚧 Maintenance Mode

* **ON:** Blockerar all åtkomst utom admin, meddelande visas.
* **OFF:** Normalt driftläge.

## 🔐 SSO och RBAC-funktion

### OFF (standardläge)

* Full åtkomst för alla.
* Global varning: "SSO/RBAC är avstängt. Alla har full åtkomst."

### ON

* Autentisering via Active Directory.
* Rollstyrd åtkomst.

## 📁 Karantänfunktion

* Filer markerade som "ej godkända" hamnar i karantän.
* Admin kan granska, släppa eller ta bort filer via adminpanelen.

## 📄 Loggläsare

* Visning och filtrering av loggar i realtid.
* Backend-endpoint (`/admin/logs`) säkerställd via RBAC.

## 🔗 Integrationsstrategi

* RESTful API internt och externt.
* AD-integration via OpenID Connect.
* Central logghantering via Elastic Stack (Optional)

## 🛡 Säkerhetsstrategi

* JWT-autentisering.
* RBAC via AD-grupper.
* Krypterad lagring av känsliga data.
* HTTPS-certifikat via adminpanel.

## 📈 Prestanda och Skalbarhet

* Docker/Kubernetes för skalning.
* Klustring av RabbitMQ.
* Databas med replikering/sharding.

## 🔄 Drift, CI/CD och Övervakning

* CI/CD pipelines (GitHub Actions).
* Övervakning/loggning via Prometheus/Grafana och Elastic Stack.

## 📜 Databasstruktur

```sql
CREATE TABLE scans (
  id UUID PRIMARY KEY,
  filename TEXT NOT NULL,
  status TEXT,
  virus_result JSONB,
  checksum_results JSONB,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE admin_config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 🎯 Informationsflöden

**Normal drift:**

```
Användare → AD (SSO) → API → RabbitMQ → Workers → DB → Resultat
```

**Maintenance mode ON:**

```
Användare → Blockerad → Underhållsmeddelande
```

**RBAC/SSO OFF:**

```
Alla → Fri åtkomst med global varning
```

## 🗃 Konfigurationslägen

| Maintenance | RBAC/SSO | Effekt                              |
| ----------- | -------- | ----------------------------------- |
| ON ✅        | -        | Admin-åtkomst, blockerar övriga     |
| OFF ❌       | OFF ❌    | Fri åtkomst med global varning      |
| OFF ❌       | ON ✅     | AD-autentisering och RBAC aktiverat |

## 🚩 Nästa steg

1. Implementera backend-endpoints för konfigurationshantering.
2. Utveckla frontend-adminpanel inkl. loggläsare och karantänfunktion.
3. AD-integrering och HTTPS-konfiguration.
4. Etablera logghantering med Elastic Stack.
5. Utför omfattande testning och dokumentation.

## 🛠 Projektplan

### **Fas 1: Förberedelse**
1. **Skapa projektstruktur**:
   - Frontend: React.
   - Backend: FastAPI.
   - Workers: Python.
   - Databas: PostgreSQL.
   - Meddelandekö: RabbitMQ.
2. **Installera och konfigurera verktyg**:
   - Docker/Kubernetes för containerhantering.
   - CI/CD pipelines med GitHub Actions.
   - Övervakning med Prometheus/Grafana.

### **Fas 2: Backend**
1. **Implementera API**:
   - JWT-autentisering.
   - Endpoints för uppladdning, nedladdning, och karantänhantering.
   - Admin-endpoints för konfigurationshantering.
2. **Integrera med RabbitMQ**:
   - Skapa köer för asynkrona jobb.
3. **Implementera Workers**:
   - Virus-worker (ClamAV).
   - Checksum-worker.
   - Secondary-scan-worker (valfritt).

### **Fas 3: Frontend**
1. **Utveckla användargränssnitt**:
   - Uppladdning och nedladdning av filer.
   - Dark mode toggle.
   - Företagslogotyp.
2. **Utveckla adminpanel**:
   - Översiktsvy.
   - Hantering av karantänfiler.
   - Konfigurationshantering (HTTP/HTTPS, certifikat, logotyp).

### **Fas 4: Databas**
1. **Skapa databasstruktur**:
   - Tabeller för metadata, karantänstatus, konfigurationsdata.
   - Persistens för inställningar och logotyp.
2. **Implementera replikering/sharding**:
   - För skalbarhet.

### **Fas 5: Säkerhet**
1. **Implementera RBAC/SSO**:
   - Integration med Active Directory.
   - Rollstyrd åtkomst.
2. **Konfigurera HTTPS**:
   - Certifikathantering via adminpanelen.

### **Fas 6: Logghantering**
1. **Implementera realtidsloggar**:
   - Backend-endpoint för loggläsning.
2. **Integrera Elastic Stack**:
   - Central logghantering.

### **Fas 7: Testning och Dokumentation**
1. **Utför omfattande testning**:
   - Funktionalitet, säkerhet, prestanda.
2. **Skapa dokumentation**:
   - Användarmanual.
   - Teknisk dokumentation.

### **Fas 8: Deployment**
1. **Konfigurera CI/CD pipelines**:
   - Automatiserad byggning och deployment.
2. **Driftsätt applikationen**:
   - Produktionsmiljö med övervakning.
