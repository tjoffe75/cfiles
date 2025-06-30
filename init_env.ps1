# Skapar .env och frontend/.env automatiskt med slumpade RabbitMQ-värden
if (-Not (Test-Path ".env")) {
    $user = "user$([guid]::NewGuid().ToString('N').Substring(0,8))"
    $pass = [System.Web.Security.Membership]::GeneratePassword(16,3)
    $wsurl = "ws://localhost:8000/ws/status"
    Set-Content .env @"
RABBITMQ_DEFAULT_USER=$user
RABBITMQ_DEFAULT_PASS=$pass
REACT_APP_WS_URL=$wsurl
"@
    Write-Host "Skapade .env med RabbitMQ-user: $user och pass: $pass"
}

if (-Not (Test-Path "frontend\.env")) {
    $wsurl = "ws://localhost:8000/ws/status"
    Set-Content frontend\.env @"
REACT_APP_WS_URL=$wsurl
"@
    Write-Host "Skapade frontend\.env"
}
