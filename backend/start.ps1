# PowerShell script para iniciar los servicios

# Aplicar migraciones de base de datos
Write-Host "Aplicando migraciones de base de datos..."
docker-compose run --rm api alembic upgrade head

# Iniciar todos los servicios
Write-Host "Iniciando servicios..."
docker-compose up -d

Write-Host "Servicios iniciados. Puedes acceder a:"
Write-Host "- API: http://api.localhost"
Write-Host "- PgAdmin: http://pgadmin.localhost"
Write-Host "- Traefik Dashboard: http://traefik.localhost"
