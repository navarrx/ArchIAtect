FROM python:3.10-slim

WORKDIR /app/

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# PIP config to speed up installs and avoid cache bloat
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu

# Copy requirements and install heavy deps first (CPU wheels)
COPY ./requirements.txt /app/
RUN pip install --prefer-binary torch==2.2.0 torchvision==0.17.0 --extra-index-url https://download.pytorch.org/whl/cpu && \
    pip install --prefer-binary --upgrade -r requirements.txt

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