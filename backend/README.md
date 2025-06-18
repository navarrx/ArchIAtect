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
# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=archi_atect

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
```

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
