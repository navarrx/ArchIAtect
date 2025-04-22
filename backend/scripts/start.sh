#!/bin/bash

# Apply database migrations
docker-compose run --rm api alembic upgrade head

# Start all services
docker-compose up -d

echo "Services started. You can access:"
echo "- API: http://api.localhost"
echo "- PgAdmin: http://pgadmin.localhost"
echo "- Traefik Dashboard: http://traefik.localhost"
