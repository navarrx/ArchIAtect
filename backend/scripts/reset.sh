#!/bin/bash

# Stop all services and remove volumes
docker-compose down -v

echo "Services stopped and volumes removed."
echo "Run './scripts/init.sh' to reinitialize the project."
