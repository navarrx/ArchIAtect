# PowerShell script para reiniciar el proyecto

# Detener todos los servicios y eliminar volúmenes
Write-Host "Deteniendo servicios y eliminando volúmenes..."
docker-compose down -v

Write-Host "Servicios detenidos y volúmenes eliminados."
Write-Host "Ejecuta './setup.ps1' para reinicializar el proyecto."
