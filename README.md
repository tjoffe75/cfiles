# cfiles - Secure File Upload & Scan

A robust application for secure file uploads, where each file is automatically sent to a separate process for virus scanning. Built with a scalable microservice architecture.

For a detailed project overview, see [PROJECT.md](PROJECT.md).
For a deep dive into the technical implementation, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Modern UI Features (2025)

- Nytt modernt gränssnitt med centrerad titel och logotyp i vänstra hörnet.
- Alltid synlig dark mode-toggle längst upp till höger.
- SSO/RBAC-statusbanner alltid överst.
- Snygg och responsiv sidomeny (SideNav).
- Logotypen kan bytas ut genom att ersätta `frontend/public/logo-placeholder.svg`.

---

## 1. Tech Stack

*   **Backend**: FastAPI (Python)
*   **Frontend**: React
*   **Message Queue**: RabbitMQ
*   **Worker**: Python
*   **Database**: PostgreSQL
*   **Virus Scanner**: ClamAV
*   **Containerization**: Docker & Docker Compose

## 2. Getting Started

**Prerequisites:**
*   Docker
*   Docker Compose
*   (Optional) Node.js LTS if you want to run the frontend outside Docker

**Environment setup:**
- On **Windows** (PowerShell):
  ```powershell
  ./init_env.ps1
  ```
- On **Linux/macOS** (bash):
  ```bash
  bash init_env.sh
  ```
- Dessa skript kommer automatiskt att skapa `.env` och `frontend/.env` med slumpmässiga säkra värden om de inte redan finns.
- Du kan redigera `.env` och `frontend/.env` manuellt om du vill ändra några värden.

**Installation & Running:**

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd cfiles
    ```
2.  **Create environment files:** (se ovan)
3.  **Build and start all services:**
    ```bash
    docker compose up -d --build
    ```
4.  The application is now running:
    *   **Frontend**: [http://localhost:3000](http://localhost:3000)
    *   **Backend API**: [http://localhost:8000](http://localhost:8000)

## 3. Usage

Use the web interface at [http://localhost:3000](http://localhost:3000) to upload and view files. You can also use the API directly.

**Check status via API:**
```bash
curl http://localhost:8000/config/files/
```

**Inspect the quarantine directory:**
```bash
docker compose exec backend ls /quarantine
```
