# ArchIAtect 🏗️

[English](#english) | [Español](#español)

## English

### Project Overview
ArchIAtect is an innovative architectural design tool that leverages artificial intelligence to generate floor plan sketches. This project was developed as a thesis project for the Computer Engineering degree at Universidad de Mendoza, Argentina.

### Features
- AI-powered floor plan generation using state-of-the-art diffusion models
- User authentication and project management
- Responsive and modern UI
- RESTful API architecture
- Secure file handling and storage

### Tech Stack
#### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI Components
- Framer Motion for animations
- React Hook Form for form management

#### Backend
- FastAPI
- Python
- SQLAlchemy
- Alembic for database migrations
- JWT Authentication
- Docker support
- AI/ML Dependencies:
  - PyTorch
  - Diffusers
  - Transformers
  - Accelerate
  - PEFT
  - SpaCy
  - NetworkX
  - Matplotlib

### Getting Started

#### Prerequisites
- Node.js (v18 or higher)
- Python 3.8+
- Docker (optional)
- CUDA-compatible GPU (recommended for AI model inference)
- PostgreSQL database
- Google Cloud Storage account (for file storage)

#### Environment Setup

1. Frontend Environment (.env in frontend directory):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

2. Backend Environment (.env in backend directory):
```bash
# API Configuration
SECRET_KEY=your_secret_key_here
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8080"]

# PostgreSQL Database
POSTGRES_SERVER=localhost
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=floor_plan_generator

# PgAdmin (optional)
PGADMIN_DEFAULT_EMAIL=your_email
PGADMIN_DEFAULT_PASSWORD=your_password

# Initial superuser (optional)
FIRST_SUPERUSER=your_email
FIRST_SUPERUSER_PASSWORD=your_password

# Google Cloud Storage
GOOGLE_APPLICATION_CREDENTIALS=backend/secrets/your-credentials.json
GCS_BUCKET_NAME=your-bucket-name
```

3. Google Cloud Storage Setup:
   - Create a Google Cloud Storage bucket
   - Create a service account and download the credentials JSON file
   - Create a `secrets` directory in the backend folder
   - Place the credentials JSON file in the `backend/secrets` directory
   - Add `secrets/` to your `.gitignore` file

#### Installation

1. Clone the repository:
```bash
git clone https://github.com/navarrx/ArchIAtect.git
cd ArchIAtect
```

2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

3. Backend Setup:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m app.main
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Project Structure
```
ArchIAtect/
├── frontend/          # Next.js frontend application
├── backend/           # FastAPI backend application
│   ├── secrets/      # Google Cloud credentials
│   └── ...
└── README.md
```

### Author
- **Santiago Navarro**
- Computer Engineering Student
- Universidad de Mendoza, Argentina

### License
This project is licensed under the MIT License - see the LICENSE file for details.

---

## Español

### Descripción del Proyecto
ArchIAtect es una herramienta innovadora de diseño arquitectónico que utiliza inteligencia artificial para generar bocetos planos de viviendas. Este proyecto fue desarrollado como tesis para la carrera de Ingeniería en Informática en la Universidad de Mendoza, sede San Rafael, Argentina.

### Características
- Generación de planos mediante modelos de difusión de última generación
- Autenticación de usuarios y gestión de proyectos
- Interfaz de usuario moderna y responsiva
- Arquitectura API RESTful
- Manejo y almacenamiento seguro de archivos

### Stack Tecnológico
#### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Componentes Radix UI
- Framer Motion para animaciones
- React Hook Form para gestión de formularios

#### Backend
- FastAPI
- Python
- SQLAlchemy
- Alembic para migraciones de base de datos
- Autenticación JWT
- Soporte para Docker
- Dependencias de IA/ML:
  - PyTorch
  - Diffusers
  - Transformers
  - Accelerate
  - PEFT
  - SpaCy
  - NetworkX
  - Matplotlib

### Comenzando

#### Prerrequisitos
- Node.js (v18 o superior)
- Python 3.8+
- Docker (opcional)
- GPU compatible con CUDA (recomendado para inferencia del modelo de IA)
- Base de datos PostgreSQL
- Cuenta de Google Cloud Storage (para almacenamiento de archivos)

#### Configuración del Entorno

1. Entorno Frontend (.env en directorio frontend):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

2. Entorno Backend (.env en directorio backend):
```bash
# Configuración de API
SECRET_KEY=tu_clave_secreta_aqui
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8080"]

# Base de datos PostgreSQL
POSTGRES_SERVER=localhost
POSTGRES_USER=tu_usuario_db
POSTGRES_PASSWORD=tu_contraseña_db
POSTGRES_DB=floor_plan_generator

# PgAdmin (opcional)
PGADMIN_DEFAULT_EMAIL=tu_email
PGADMIN_DEFAULT_PASSWORD=tu_contraseña

# Superusuario inicial (opcional)
FIRST_SUPERUSER=tu_email
FIRST_SUPERUSER_PASSWORD=tu_contraseña

# Google Cloud Storage
GOOGLE_APPLICATION_CREDENTIALS=backend/secrets/tu-archivo-credenciales.json
GCS_BUCKET_NAME=tu-nombre-bucket
```

3. Configuración de Google Cloud Storage:
   - Crear un bucket en Google Cloud Storage
   - Crear una cuenta de servicio y descargar el archivo JSON de credenciales
   - Crear un directorio `secrets` en la carpeta backend
   - Colocar el archivo JSON de credenciales en el directorio `backend/secrets`
   - Agregar `secrets/` a tu archivo `.gitignore`

#### Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/navarrx/ArchIAtect.git
cd ArchIAtect
```

2. Configuración del Frontend:
```bash
cd frontend
npm install
npm run dev
```

3. Configuración del Backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m app.main
```

4. Acceder a la aplicación:
- Frontend: http://localhost:3000
- API Backend: http://localhost:8000
- Documentación API: http://localhost:8000/docs

### Estructura del Proyecto
```
ArchIAtect/
├── frontend/          # Aplicación frontend Next.js
├── backend/           # Aplicación backend FastAPI
│   ├── secrets/      # Credenciales de Google Cloud
│   └── ...
└── README.md
```

### Autor
- **Santiago Navarro**
- Estudiante de Ingeniería en Informática
- Universidad de Mendoza, Argentina

### Licencia
Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.