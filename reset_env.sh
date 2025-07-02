#!/bin/bash
# Rensa miljö och starta om cfiles (Linux/macOS)

echo "Stoppar alla tjänster..."
docker compose down -v

echo "Tar bort mappar: uploads, quarantine, testfiles..."
rm -rf uploads quarantine testfiles

echo "Tar bort .env-filer..."
rm -f .env frontend/.env

echo "Kör init-scriptet..."
bash ./init_env.sh

echo "Miljön är nu rensad och initierad. Startar tjänsterna automatiskt..."
docker compose build && docker compose up -d
