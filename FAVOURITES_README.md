# Funcionalidad de Favoritos - ArchIAtect

## Descripción General

Se ha implementado una funcionalidad completa de favoritos que permite a los usuarios marcar y gestionar sus planos favoritos de manera independiente a su colección principal de planos.

## Características Implementadas

### Backend

#### 1. Modelo de Datos (`backend/app/models/favourite.py`)
- **Tabla**: `favourites`
- **Campos**:
  - `id`: Identificador único del favorito
  - `user_id`: ID del usuario (FK a users.id)
  - `generation_id`: ID de la generación (FK a generations.id)
  - `created_at`: Fecha de creación del favorito

#### 2. Esquemas Pydantic (`backend/app/schemas/favourite.py`)
- `FavouriteBase`: Esquema base con generation_id
- `FavouriteCreate`: Para crear nuevos favoritos
- `FavouriteOut`: Para respuestas básicas
- `GenerationInfo`: Información de la generación
- `FavouriteWithGeneration`: Favorito con información completa de la generación

#### 3. Servicio (`backend/app/services/favourite_service.py`)
Funciones principales:
- `add_favourite()`: Agregar generación a favoritos
- `remove_favourite()`: Quitar generación de favoritos
- `get_user_favourites()`: Obtener favoritos básicos del usuario
- `get_user_favourites_with_generations()`: Obtener favoritos con información completa
- `is_favourite()`: Verificar si una generación está en favoritos

#### 4. Endpoints API (`backend/app/api/v1/endpoints/favourite.py`)
- `POST /api/v1/favourites/`: Agregar a favoritos
- `GET /api/v1/favourites/my`: Obtener mis favoritos (con información completa)
- `GET /api/v1/favourites/my/basic`: Obtener mis favoritos (básico)
- `DELETE /api/v1/favourites/{favourite_id}`: Quitar de favoritos
- `GET /api/v1/favourites/check/{generation_id}`: Verificar si está en favoritos

### Frontend

#### 1. Página de Favoritos (`frontend/app/favourites/page.tsx`)
- **Diseño**: Similar a "Mis Planos" pero con elementos visuales distintivos
- **Funcionalidades**:
  - Lista de favoritos con información completa
  - Búsqueda por descripción
  - Ordenamiento por fecha (más recientes/antiguos)
  - Descarga de imágenes
  - Quitar de favoritos
  - Estados de carga y error
  - Diseño responsive

#### 2. Componente Reutilizable (`frontend/components/favourite-button.tsx`)
- **Propósito**: Botón de favoritos reutilizable
- **Props**:
  - `generationId`: ID de la generación
  - `isFavourite`: Estado actual
  - `onToggle`: Callback para actualizar estado
  - `size`: Tamaño del botón
  - `variant`: Variante visual
  - `className`: Clases CSS adicionales

#### 3. Integración en "Mis Planos" (`frontend/app/my-blueprints/page.tsx`)
- **Nuevas funcionalidades**:
  - Botón de favoritos en cada plano
  - Indicador visual de favoritos (badge rojo)
  - Enlace directo a la página de favoritos
  - Verificación automática del estado de favoritos

#### 4. Navegación (`frontend/components/navbar.tsx`)
- **Menú de usuario**: Nuevo enlace "Mis Favoritos" con icono de corazón
- **Responsive**: Funciona tanto en desktop como móvil

## Flujo de Usuario

### 1. Marcar como Favorito
1. Usuario navega a "Mis Planos"
2. Hace clic en el botón de corazón en cualquier plano
3. El plano se marca como favorito (cambia a rojo)
4. Aparece un toast de confirmación

### 2. Ver Favoritos
1. Usuario hace clic en "Mis Favoritos" en el menú
2. Se muestra la página de favoritos con todos los planos marcados
3. Puede buscar, ordenar y gestionar sus favoritos

### 3. Quitar de Favoritos
1. En "Mis Planos": Hace clic en el botón de corazón (ya marcado)
2. En "Mis Favoritos": Hace clic en el botón de corazón rojo
3. Aparece un diálogo de confirmación
4. El plano se quita de favoritos

## Características de Diseño

### Visual
- **Iconos**: Uso consistente del icono de corazón (Heart de Lucide React)
- **Colores**: Rojo (#ef4444) para elementos de favoritos
- **Estados**: Diferentes estilos para favorito/no favorito
- **Badges**: Indicadores visuales en las imágenes de los planos

### UX
- **Feedback inmediato**: Cambios visuales instantáneos
- **Toast notifications**: Confirmaciones de acciones
- **Estados de carga**: Indicadores durante operaciones
- **Manejo de errores**: Mensajes claros en caso de problemas
- **Responsive**: Funciona en todos los tamaños de pantalla

## Seguridad

### Backend
- **Autenticación**: Todos los endpoints requieren token JWT
- **Autorización**: Usuarios solo pueden gestionar sus propios favoritos
- **Validación**: Verificación de existencia de generaciones y usuarios
- **Prevención de duplicados**: No se pueden agregar favoritos duplicados

### Frontend
- **Verificación de autenticación**: Redirección a login si no hay token
- **Manejo de errores**: Captura y muestra errores de API
- **Validación**: Verificación de datos antes de enviar

## Base de Datos

### Relaciones
```sql
-- Tabla favourites
CREATE TABLE favourites (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    generation_id INTEGER NOT NULL REFERENCES generations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices recomendados
CREATE INDEX idx_favourites_user_id ON favourites(user_id);
CREATE INDEX idx_favourites_generation_id ON favourites(generation_id);
CREATE UNIQUE INDEX idx_favourites_user_generation ON favourites(user_id, generation_id);
```

### Migración
Si necesitas crear la tabla de favoritos, ejecuta:
```sql
-- Crear tabla favourites
CREATE TABLE IF NOT EXISTS favourites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generation_id INTEGER NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_favourites_user_id ON favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_favourites_generation_id ON favourites(generation_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_favourites_user_generation ON favourites(user_id, generation_id);
```

## API Endpoints

### Autenticación
Todos los endpoints requieren el header:
```
Authorization: Bearer <jwt_token>
```

### Endpoints Disponibles

#### POST /api/v1/favourites/
**Agregar generación a favoritos**
```json
{
  "generation_id": 123
}
```

#### GET /api/v1/favourites/my
**Obtener mis favoritos con información completa**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "generation_id": 123,
    "created_at": "2024-01-01T00:00:00Z",
    "generation": {
      "id": 123,
      "prompt": "Casa moderna de 3 habitaciones",
      "layout_image_url": "https://...",
      "sd_image_url": "https://...",
      "status": "success",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
]
```

#### DELETE /api/v1/favourites/{favourite_id}
**Quitar de favoritos**
```json
{
  "message": "Favourite removed successfully"
}
```

#### GET /api/v1/favourites/check/{generation_id}
**Verificar si está en favoritos**
```json
{
  "is_favourite": true
}
```

## Próximas Mejoras

1. **Contador de favoritos**: Mostrar número de favoritos en el menú
2. **Filtros avanzados**: Filtrar por fecha, estado, etc.
3. **Compartir favoritos**: Funcionalidad para compartir colecciones
4. **Categorías**: Organizar favoritos en categorías
5. **Sincronización**: Sincronizar favoritos entre dispositivos
6. **Exportar**: Exportar lista de favoritos

## Notas Técnicas

- **Performance**: Los favoritos se cargan de forma lazy y se cachean
- **Escalabilidad**: La estructura permite manejar miles de favoritos por usuario
- **Mantenibilidad**: Código modular y reutilizable
- **Testing**: Endpoints probados y validados
- **Documentación**: Código documentado con docstrings 