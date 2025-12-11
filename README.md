# ArchIAtect 🏗️

[Español](#español) | [English](#english)

## Español

### Resumen
ArchIAtect es la plataforma desarrollada para mi tesis de Ingeniería en Informática (Universidad de Mendoza, sede San Rafael). Combina IA generativa y heurísticas de diseño arquitectónico para convertir descripciones en lenguaje natural en planos habitacionales utilizables.

### Objetivos de la tesis
- Automatizar la generación de planos 2D a partir de requisitos textuales.
- Mantener coherencia espacial (adyacencias, proporciones y puertas) antes de la generación visual.
- Proveer una interfaz web moderna con autenticación, gestión de proyectos y previsualizaciones exportables.
- Ofrecer un backend reproducible y desplegable (Docker/Railway) con soporte GPU local o remoto.

### Arquitectura de alto nivel
- **Frontend (Next.js 15 + React 19):** UI con Tailwind, Radix y formularios; páginas de login, registro, dashboard y generador interactivo.
- **Backend (FastAPI + PostgreSQL):** API REST con JWT/Google OAuth, migraciones Alembic y servicios de favoritos, ratings y gestión de generaciones.
- **Pipeline ML (`backend/app/ml/pipeline/floorplan_pipeline.py`):**
  1) `TextUnderstandingModule` convierte el prompt en requerimientos estructurados (habitaciones, adyacencias, estilo) usando spaCy.
  2) `LayoutGenerationModule` arma el layout en grilla mediante grafos y heurísticas de puertas, y produce imágenes para ControlNet y para el usuario.
  3) `StableDiffusionControlNetModule` refina el layout en un plano estilizado con ControlNet (scribble) + LoRA propia.
- **Infraestructura:** Docker Compose orquesta frontend, API, Postgres y Traefik. Almacenamiento en Google Cloud Storage para subidas/output cuando se despliega en nube. Servicio GPU local o remoto (`backend/app/gpu_service`).

### Flujo de generación
1. Usuario escribe un prompt (ej: “casa moderna, 3 dormitorios, cocina junto al comedor”).
2. NLP → requerimientos estructurados (habitaciones, adyacencias, estilo).
3. Layout → grilla, puertas y etiquetas; se guardan imágenes con y sin labels.
4. Difusión → ControlNet + LoRA producen el plano final en alta adherencia al layout.
5. Outputs guardados en `backend/output/` (JSON + PNG con labels + PNG para ControlNet + plano SD).

### Requisitos
- Node.js 18+
- Python 3.11+ (se usa venv en `backend/`)
- PostgreSQL
- GPU con CUDA (recomendado para Stable Diffusion); CPU funciona en modo solo-layout.
- Cuenta y bucket de Google Cloud Storage si se quiere almacenamiento remoto.

### Puesta en marcha rápida (Docker Compose)
1) Crear un `.env` en la raíz con las variables básicas:
```
POSTGRES_USER=archiatect
POSTGRES_PASSWORD=archiatect
POSTGRES_DB=archiatect
SECRET_KEY=change_me
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=admin
```
2) Ejecutar:
```
docker compose up --build
```
- Frontend: http://localhost:3000  
- API: http://localhost:8000  |  Docs: http://localhost:8000/docs  
- PgAdmin (opcional): http://localhost:5050

### Configuración manual (dev)
Frontend:
- `.env.local` en `frontend/`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
- Instalar y correr:
```
cd frontend
npm install
npm run dev
```

Backend:
- `.env` en `backend/` (resume lo usado por compose):
```
SECRET_KEY=change_me
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
POSTGRES_SERVER=localhost
POSTGRES_USER=archiatect
POSTGRES_PASSWORD=archiatect
POSTGRES_DB=archiatect
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=admin
GCS_BUCKET_NAME=tu-bucket
GOOGLE_APPLICATION_CREDENTIALS=backend/secrets/creds.json
GPU_MODE=local   # o remote si usas el túnel GPU
```
- Instalar y correr:
```
cd backend
python -m venv venv
venv\Scripts\activate  # en Windows (o source venv/bin/activate en Unix)
pip install -r requirements.txt
python -m app.main
```
- Migraciones: `alembic upgrade head`

### Modelos, datos y salidas
- Pesos LoRA y ejemplos están en `backend/app/ml/lora/`.
- spaCy `en_core_web_sm` se descarga automáticamente si no está presente.
- Carpeta `backend/output/` contiene ejemplos de JSON e imágenes generadas.
- La API puede trabajar sin SD si `GPU_MODE=local` pero no hay GPU; en ese caso solo retorna layout y visualizaciones con labels.

### Páginas y funcionalidades principales
- Registro/login (incluye flujo Google OAuth).
- Generador: ingresa prompt, obtiene plano con labels y versión refinada.
- Descubrir/Mis blueprints/Favoritos: galería y gestión de generaciones.
- Perfil: datos del usuario y ajustes básicos.

### Buenas prácticas para reproducibilidad
- Fijar seeds al generar planos SD (la API expone esta opción en el pipeline).
- Mantener sincronizados los pesos LoRA usados para inferencia y entrenamiento.
- Registrar prompts y outputs para comparar estrategias (`strict`, `balanced`, `creative`, `multi_pass`).

### Futuro y líneas de mejora
- Ajuste fino de heurísticas de puertas y adyacencias con feedback de arquitectos.
- Incorporar ventanas y mobiliario ligero en el layout antes de SD.
- Métricas automáticas de calidad del plano (consistencia topológica, área).
- Entrenamiento incremental del LoRA con datasets locales.

### Autor
- **Santiago Navarro** — Tesis de Ingeniería en Informática, Universidad de Mendoza (San Rafael).

### Licencia
MIT. Revisa `LICENSE` para detalles.

---

## English

### Overview
ArchIAtect is my Computer Engineering thesis project (Universidad de Mendoza, San Rafael). It turns natural-language housing requirements into 2D floor plans by combining NLP, graph-based layout generation, and a ControlNet + LoRA diffusion model.

### Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind, Radix UI, Framer Motion.
- **Backend:** FastAPI, SQLAlchemy, Alembic, JWT/Google OAuth, PostgreSQL, Docker.
- **ML pipeline:** text parsing → layout graph generation → ControlNet + LoRA refinement.
- **Infra:** Docker Compose with Traefik; optional GCS for storage; GPU service local/remote.

### Quick start
1) Root `.env` (same keys as in the Spanish section).  
2) `docker compose up --build`  
3) Frontend at `http://localhost:3000`, API at `http://localhost:8000` (docs at `/docs`).

### Development
- Frontend: set `NEXT_PUBLIC_API_URL`, run `npm install && npm run dev`.
- Backend: create `.env`, `pip install -r requirements.txt`, run `python -m app.main`; migrate with `alembic upgrade head`.

### Outputs
Sample JSON layouts and PNGs live in `backend/output/`. LoRA weights are in `backend/app/ml/lora/`; spaCy downloads `en_core_web_sm` if missing.

### License
MIT. See `LICENSE`.