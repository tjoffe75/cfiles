# Rensa miljö och starta om cfiles (Windows)
Write-Host "Stoppar alla tjänster..."
docker compose down -v

Write-Host "Tar bort mappar: uploads, quarantine, testfiles..."
Remove-Item -Recurse -Force uploads,quarantine,testfiles -ErrorAction SilentlyContinue

Write-Host "Tar bort .env-filer..."
Remove-Item -Force .env,frontend/.env -ErrorAction SilentlyContinue

Write-Host "Kör init-scriptet..."
./init_env.ps1

Write-Host "Miljön är nu rensad och initierad. Startar tjänsterna automatiskt..."
docker compose build
docker compose up -d
