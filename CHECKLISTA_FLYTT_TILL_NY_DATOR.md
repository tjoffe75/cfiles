# Checklist: Move and Start Filesapp on a New Computer (Windows)

> **Update 2025:**
> - The interface is now modern and responsive with a centered title and logo in the top left corner.
> - The dark mode toggle is always visible in the top bar.
> - The logo can be replaced by changing `frontend/public/logo-placeholder.svg`.

1. **Install prerequisites**
   - [Git](https://git-scm.com/download/win)
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - (Optional) [Node.js LTS](https://nodejs.org/) if you want to run the frontend outside Docker

2. **Clone the repository from GitHub**
   ```powershell
   git clone <repo-url>
   cd cfiles
   ```

3. **Automatically create environment variables**
   ```powershell
   ./init_env.ps1
   ```
   - The script creates `.env` and `frontend\.env` with random RabbitMQ values if they don't already exist.
   - Open `.env` and `frontend\.env` in any editor if you want to change something.

4. **Build and start with Docker**
   ```powershell
   docker compose build
   docker compose up -d
   ```
   - Make sure `pyjwt` is included in `backend/requirements.txt` (should already be added).
   - If you have added new Python packages (e.g. `pyjwt`):
     ```powershell
     docker compose build backend
     docker compose up -d backend
     ```
   - This ensures the backend has all new dependencies.

5. **Verify that everything works**
   - Check logs if needed:
     ```powershell
     docker compose logs
     ```
   - Open in your browser:
     - Backend: http://localhost:8000/docs
     - Frontend: http://localhost:3000

6. **(Only if you want to run the frontend outside Docker)**
   ```powershell
   cd frontend
   npm install
   npm start
   ```

7. **Test file upload and scanning**
   - Upload a file via the frontend and check that the status updates.

8. **Read README.md for more info and troubleshooting tips**

---

## Reset to a completely clean app

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

> **Important about file handling and Docker:**
> 
> All files uploaded or handled by the app are stored in the `uploads`, `quarantine`, and `testfiles` folders in the project directory. These folders are mapped directly to the containers via `docker-compose.yml` (e.g. `./uploads:/uploads`).
> 
> This means the files are always stored on your computer and not in the container's internal storage. This way, you don't risk the container filling up, and you can easily back up or move the files if needed.
> 
> If you want to change where the files are stored, adjust the mapping in `docker-compose.yml`.
