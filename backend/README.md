# ArchIAtect Backend

Backend API para el generador de planos arquitectónicos con IA.

## Requisitos

- Python 3.8+
- PostgreSQL
- Google Cloud Platform account (para autenticación OAuth)

## Configuración del Entorno

1. Crear un entorno virtual:
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Configurar variables de entorno:
Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Database (opción 1: variables individuales)
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=archi_atect
# Database (opción 2: URL completa, ideal para Railway)
# DATABASE_URL=postgresql://user:pass@host:port/dbname

# Security
SECRET_KEY=your_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 días

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Optional: Superuser
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=admin_password

# CORS (separar por coma)
BACKEND_CORS_ORIGINS=http://localhost:3000,https://tu-frontend.railway.app

# Almacenamiento GCS
GCS_BUCKET_NAME=tu-bucket
# Credenciales: JSON o base64 del JSON (recomendado para Railway)
# GCS_CREDENTIALS_JSON='{"type": "..."}'   # o en base64
# Alternativa: ruta a archivo local
# GCS_CREDENTIALS_FILE=/path/to/creds.json

# GPU remoto/local (Railway usa modo remote)
GPU_MODE=remote           # remote | local
GPU_SERVICE_URL=https://tu-tunel.example.com
GPU_SERVICE_TOKEN=token_seguro_compartido
GPU_REQUEST_TIMEOUT=120   # segundos
```

## Despliegue en Railway (backend)

1. Crear servicio Postgres y copiar `DATABASE_URL`.
2. Crear servicio Backend desde este directorio (`backend/`) usando el Dockerfile.
3. Variables en Railway:
   - `DATABASE_URL`, `SECRET_KEY`, `GOOGLE_CLIENT_ID/SECRET`, `GCS_*`,
     `BACKEND_CORS_ORIGINS` con el dominio del frontend,
     `GPU_MODE=remote`, `GPU_SERVICE_URL`, `GPU_SERVICE_TOKEN`.
4. Release phase (sugerido): `alembic upgrade head`.
5. Healthcheck: GET `/` o `/api/v1/users/me` con auth.

## Servicio GPU local + túnel

1. Instala dependencias (con GPU) y arranca el servicio:
```bash
uvicorn app.gpu_service.main:app --host 0.0.0.0 --port 8001
# Variables: GPU_ENABLE_SD=true/false, GPU_SERVICE_TOKEN=token
```
2. Crea el túnel seguro (ejemplos):
   - Cloudflare: `cloudflared tunnel run --url http://localhost:8001 --hostname gpu-demo.tu-dominio.com`
   - Ngrok: `ngrok http 8001 --authtoken <token>`
3. Configura en Railway:
   - `GPU_SERVICE_URL` con la URL pública del túnel.
   - `GPU_SERVICE_TOKEN` igual al usado localmente.
   - `GPU_MODE=remote`.
4. Reinicia el backend en Railway para tomar la URL.

4. Configurar Google OAuth:
   - Ir a [Google Cloud Console](https://console.cloud.google.com)
   - Crear un nuevo proyecto o seleccionar uno existente
   - Habilitar la API de Google OAuth 2.0
   - Crear credenciales OAuth 2.0
   - Configurar las URIs autorizadas:
     - Orígenes autorizados de JavaScript: `http://localhost:3000`
     - URIs de redireccionamiento autorizados: `http://localhost:3000/auth/google/callback`
   - Copiar el Client ID y Client Secret al archivo `.env`

5. Inicializar la base de datos:
```bash
python init_db.py
```

## Ejecutar la Aplicación

1. Iniciar el servidor de desarrollo:
```bash
uvicorn app.main:app --reload
```

El servidor estará disponible en `http://localhost:8000`

## Documentación de la API

La documentación de la API está disponible en:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Autenticación

La API soporta dos métodos de autenticación:

1. **Autenticación Local**:
   - Registro: `POST /api/v1/auth/register`
   - Login: `POST /api/v1/auth/token`

2. **Autenticación con Google**:
   - Iniciar flujo: `GET /api/v1/auth/google/login`
   - Callback: `POST /api/v1/auth/google/callback`

Los tokens de acceso deben incluirse en el header de las peticiones:
```
Authorization: Bearer <token>
```

## Estructura del Proyecto

```
backend/
├── alembic/              # Migraciones de la base de datos
├── app/
│   ├── api/             # Endpoints de la API
│   ├── core/            # Configuración y utilidades
│   ├── db/              # Configuración de la base de datos
│   ├── models/          # Modelos de SQLAlchemy
│   ├── schemas/         # Esquemas Pydantic
│   └── services/        # Lógica de negocio
├── uploads/             # Archivos subidos
└── requirements.txt     # Dependencias
```

## Desarrollo

### Migraciones de Base de Datos

1. Crear una nueva migración:
```bash
alembic revision --autogenerate -m "descripción"
```

2. Aplicar migraciones:
```bash
alembic upgrade head
```

### Tests

```bash
pytest
```

## Docker

Construir la imagen:
```bash
docker build -t archi-atect-backend .
```

Ejecutar el contenedor:
```bash
docker run -p 8000:8000 archi-atect-backend
```
