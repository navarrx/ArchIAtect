FROM python:3.9-slim

WORKDIR /app/

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY ./requirements.txt /app/
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy application code
COPY ./app /app/app
COPY ./alembic.ini /app/alembic.ini
COPY ./alembic /app/alembic

# Create uploads directory
RUN mkdir -p /app/uploads \
    /app/uploads/generated \
    /app/uploads/generated/thumbnails \
    /app/uploads/uploads

# Set environment variables
ENV PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Run the application with uvicorn (Railway provides $PORT)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]