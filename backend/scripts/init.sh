#!/bin/bash

# Create necessary directories
mkdir -p traefik/config
mkdir -p uploads
mkdir -p uploads/generated
mkdir -p uploads/generated/thumbnails
mkdir -p uploads/uploads

# Create .env file from example if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from example. Please edit it with your actual values."
fi

# Generate a random secret key
SECRET_KEY=$(openssl rand -hex 32)
sed -i "s/your-secret-key-here/$SECRET_KEY/" .env

# Create initial migration
docker-compose run --rm api alembic revision --autogenerate -m "Initial migration"

echo "Initialization complete. Please update your .env file with actual values."
echo "Then run 'docker-compose up -d' to start the services."
