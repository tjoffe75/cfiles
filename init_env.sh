#!/bin/bash
# Creates .env and frontend/.env with random RabbitMQ and Postgres values (Linux/macOS)

# Generate random string (A-Za-z0-9, 16 chars)
randstr() {
  tr -dc 'A-Za-z0-9' </dev/urandom | head -c 16
}

# .env
if [ ! -f .env ]; then
  RABBIT_USER="user$(cat /proc/sys/kernel/random/uuid | tr -d '-' | head -c 8)"
  RABBIT_PASS="$(randstr)"
  WS_URL="ws://localhost:8000/ws/status"
  PG_USER="cfiles"
  PG_DB="cfilesdb"
  PG_PASS="$(randstr)"
  cat > .env <<EOF
RABBITMQ_DEFAULT_USER=$RABBIT_USER
RABBITMQ_DEFAULT_PASS=$RABBIT_PASS
RABBITMQ_HOST=rabbitmq
REACT_APP_WS_URL=$WS_URL
POSTGRES_USER=$PG_USER
POSTGRES_PASSWORD=$PG_PASS
POSTGRES_DB=$PG_DB
EOF
  echo "Created .env with RabbitMQ-user: $RABBIT_USER, pass: $RABBIT_PASS, Postgres-user: $PG_USER, Postgres-pass: $PG_PASS, Postgres-db: $PG_DB"
else
  # Ensure Postgres vars exist
  touch .env
  grep -q '^POSTGRES_USER=' .env || echo 'POSTGRES_USER=cfiles' >> .env
  grep -q '^POSTGRES_PASSWORD=' .env || echo "POSTGRES_PASSWORD=$(randstr)" >> .env
  grep -q '^POSTGRES_DB=' .env || echo 'POSTGRES_DB=cfilesdb' >> .env
  echo ".env updated with missing Postgres variables if needed."
fi

# frontend/.env
if [ ! -f frontend/.env ]; then
  WS_URL="ws://localhost:8000/ws/status"
  mkdir -p frontend
  echo "REACT_APP_WS_URL=$WS_URL" > frontend/.env
  echo "Created frontend/.env"
fi
