# PowerShell script para configurar el proyecto en Windows

# Crear directorios necesarios
New-Item -ItemType Directory -Force -Path traefik/config
New-Item -ItemType Directory -Force -Path uploads
New-Item -ItemType Directory -Force -Path uploads/generated
New-Item -ItemType Directory -Force -Path uploads/generated/thumbnails
New-Item -ItemType Directory -Force -Path uploads/uploads

# Crear archivo .env desde el ejemplo si no existe
if (-not (Test-Path -Path ".env" -PathType Leaf)) {
    Copy-Item ".env.example" ".env"
    Write-Host "Archivo .env creado desde el ejemplo. Por favor, edítalo con tus valores reales."
    
    # Generar una clave secreta aleatoria
    $randomKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    (Get-Content -Path ".env") -replace "your-secret-key-here", $randomKey | Set-Content -Path ".env"
}

# Crear migración inicial
Write-Host "Creando migración inicial de la base de datos..."
docker-compose run --rm api alembic revision --autogenerate -m "Initial migration"

Write-Host "Configuración completada. Por favor, actualiza tu archivo .env con valores reales."
Write-Host "Luego ejecuta 'docker-compose up -d' para iniciar los servicios."
