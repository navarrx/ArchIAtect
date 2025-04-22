# Floor Plan Generator API

Este es el backend API para el proyecto de tesis del Generador de Planos. Utiliza FastAPI para servir un modelo de IA que genera bocetos de planos de planta basados en parámetros de entrada.

## Estructura del Proyecto

\`\`\`
project_name/
│
├── app/                          # Código principal de la aplicación
│   ├── main.py                   # Punto de entrada de la app (FastAPI instance y rutas incluidas)
│   ├── api/                      # Rutas organizadas por módulos
│   │   ├── __init__.py
│   │   ├── v1/                   # Versión de la API
│   │   │   ├── endpoints/
│   │   │   │   ├── floor_plans.py # Rutas de planos
│   │   │   │   ├── users.py      # Rutas de usuarios
│   │   │   │   ├── auth.py       # Rutas de autenticación
│   │   │   └── __init__.py
│   ├── core/                     # Configuración central de la app
│   │   ├── config.py             # Config. de entorno y variables
│   │   ├── security.py           # Lógica de autenticación/autorización
│   ├── schemas/                  # Esquemas de validación con Pydantic
│   │   ├── floor_plan.py
│   │   ├── user.py
│   │   ├── token.py
│   ├── services/                 # Lógica de negocio (servicios reutilizables)
│   │   ├── floor_plan_service.py
│   │   ├── user_service.py
│   ├── ml/                       # Modelo de IA para generación de planos
│   │   ├── floor_plan_model.py
│   └── utils/                    # Utilidades generales
│       ├── helpers.py
│
├── tests/                        # Pruebas automatizadas
│   ├── test_floor_plans.py
│
├── .env                          # Variables de entorno (usado con `python-dotenv`)
├── requirements.txt              # Dependencias del proyecto
└── README.md                     # Documentación del proyecto
\`\`\`

## Configuración

1. Crear un entorno virtual:
   \`\`\`
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   \`\`\`

2. Instalar dependencias:
   \`\`\`
   pip install -r requirements.txt
   \`\`\`

3. Crear archivo .env:
   \`\`\`
   cp .env.example .env
   # Editar .env con tus configuraciones
   \`\`\`

4. Ejecutar el servidor:
   \`\`\`
   python -m app.main
   \`\`\`

   O alternativamente:
   \`\`\`
   uvicorn app.main:app --reload
   \`\`\`

5. Acceder a la documentación de la API en:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Endpoints de la API

### Planos de Planta
- `POST /api/v1/floor-plans/generate`: Generar un plano basado en parámetros de entrada
- `POST /api/v1/floor-plans/upload-reference`: Subir una imagen de referencia
- `GET /api/v1/floor-plans/history`: Obtener historial de planos generados
- `GET /api/v1/floor-plans/{floor_plan_id}`: Obtener un plano específico por ID

### Usuarios
- `POST /api/v1/users/`: Crear un nuevo usuario
- `GET /api/v1/users/me`: Obtener información del usuario actual
- `PUT /api/v1/users/me`: Actualizar información del usuario actual

### Autenticación
- `POST /api/v1/auth/token`: Obtener token de acceso (login)

## Integración con Frontend

La API está configurada con CORS para permitir solicitudes desde tu aplicación frontend. Para producción, actualiza el parámetro `BACKEND_CORS_ORIGINS` en la configuración del middleware CORS para especificar la URL de tu frontend.
