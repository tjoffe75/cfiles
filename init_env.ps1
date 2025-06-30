# Skapar .env och frontend/.env automatiskt med slumpade RabbitMQ- och Postgres-värden
if (-Not (Test-Path ".env")) {
    $user = "user$([guid]::NewGuid().ToString('N').Substring(0,8))"
    # Generera ett slumpat lösenord (16 tecken, bokstäver och siffror, funkar i alla PowerShell-versioner)
    $pass = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | % {[char]$_})
    $wsurl = "ws://localhost:8000/ws/status"
    $pguser = "filesapp"
    $pgdb = "filesappdb"
    # Slumpar ett lösenord för Postgres
    $pgpass = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | % {[char]$_})
    Set-Content .env @"
RABBITMQ_DEFAULT_USER=$user
RABBITMQ_DEFAULT_PASS=$pass
REACT_APP_WS_URL=$wsurl
POSTGRES_USER=$pguser
POSTGRES_PASSWORD=$pgpass
POSTGRES_DB=$pgdb
"@
    Write-Host "Skapade .env med RabbitMQ-user: $user, pass: $pass, Postgres-user: $pguser, Postgres-pass: $pgpass, Postgres-db: $pgdb"
} else {
    # Om .env redan finns, se till att Postgres-variabler finns (lägg till om de saknas)
    $envLines = Get-Content .env
    $changed = $false
    if (-not ($envLines -match '^POSTGRES_USER=')) {
        Add-Content .env "POSTGRES_USER=filesapp"
        $changed = $true
    }
    if (-not ($envLines -match '^POSTGRES_PASSWORD=')) {
        # Slumpar ett lösenord för Postgres
        $pgpass = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | % {[char]$_})
        Add-Content .env "POSTGRES_PASSWORD=$pgpass"
        $changed = $true
    }
    if (-not ($envLines -match '^POSTGRES_DB=')) {
        Add-Content .env "POSTGRES_DB=filesappdb"
        $changed = $true
    }
    if ($changed) { Write-Host ".env uppdaterad med saknade Postgres-variabler." }
}

if (-Not (Test-Path "frontend\.env")) {
    $wsurl = "ws://localhost:8000/ws/status"
    Set-Content frontend\.env @"
REACT_APP_WS_URL=$wsurl
"@
    Write-Host "Skapade frontend\.env"
}
