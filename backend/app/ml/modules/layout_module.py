import numpy as np
import matplotlib.pyplot as plt
from typing import Dict, List, Tuple, Any, Optional
import random
import networkx as nx
import math
import time

class LayoutGenerationModule:
    def __init__(self):
        # Multiplicadores de tamaño de habitación para convertir pies cuadrados a celdas de grilla
        # Asumiendo 1 celda de grilla = 20 pies cuadrados (ajustable)
        self.grid_cell_size = 20  # pies cuadrados por celda
        
        # Patrones comunes de puertas (coordenadas relativas)
        self.doorway_patterns = [
            [(0, 0), (1, 0)],  # puerta horizontal
            [(0, 0), (0, 1)]   # puerta vertical
        ]
        
        # Mapa de colores para visualización de habitaciones
        self.room_colors = {
            "bedroom": "#C5D8FF",        
            "bathroom": "#AEE1FF",       
            "kitchen": "#FFCBA4",       
            "living room": "#D7FFD7",    
            "dining room": "#FFD7D7",    
            "garage": "#DADADA",         
            "laundry room": "#D4F0F0",   
            "entryway": "#FFE4B5",      
        }
        
        # Dimensiones predeterminadas de habitaciones (en celdas de grilla)
        # Hay que ajustar los tamaños con un arquitecto para tener más precisión en los tamaños (pendiente)
        self.default_room_dimensions = {
            "bedroom": (4, 4),         # 16 celdas * 20 pies cuadrados = 320 pies cuadrados
            "bathroom": (2, 3),        # 6 celdas * 20 pies cuadrados = 120 pies cuadrados
            "kitchen": (4, 3),         # 12 celdas * 20 pies cuadrados = 240 pies cuadrados
            "living room": (5, 5),     # 25 celdas * 20 pies cuadrados = 500 pies cuadrados
            "dining room": (4, 4),     # 16 celdas * 20 pies cuadrados = 320 pies cuadrados
            "garage": (5, 5),          # 25 celdas * 20 pies cuadrados = 500 pies cuadrados
            "laundry room": (2, 2),    # 4 celdas * 20 pies cuadrados = 80 pies cuadrados
            "entryway": (3, 3),      # 9 celdas * 20 pies cuadrados = 180 pies cuadrados
        }
    
    def generate_layout(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Genera un plano basado en los requerimientos del módulo de comprensión de texto.
        
        Args:
            requirements: Datos estructurados sobre los requerimientos del plano
            
        Returns:
            Diccionario conteniendo el plano generado
        """
        # Agregar aleatoriedad para asegurar diferentes planos en cada ejecución
        random.seed(int(time.time()))
        
        # Extraer datos de las habitaciones
        rooms_data = self._preprocess_rooms(requirements["rooms"])
        
        # Crear grafo de adyacencia de habitaciones
        adjacency_graph = self._create_adjacency_graph(rooms_data, requirements.get("adjacency", []))
        
        # Determinar tamaño de grilla basado en área total
        total_cells = sum(room["grid_cells"] for room in rooms_data)
        grid_size = self._calculate_grid_size(total_cells)
        
        # Ubicar habitaciones usando un enfoque basado en grafos con aleatorización
        room_placements = self._place_rooms(rooms_data, adjacency_graph, grid_size)
        
        # Obtener tamaño real necesario después de ubicar todas las habitaciones
        max_x = max(r["x"] + r["width"] for r in room_placements)
        max_y = max(r["y"] + r["height"] for r in room_placements)
        actual_grid_size = (max_x, max_y)
        
        # Crear representación de grilla con el tamaño real necesario
        grid = np.zeros((max_y, max_x), dtype=int)
        for room in room_placements:
            room_id = room["id"]
            x, y = room["x"], room["y"]
            room_width, room_height = room["width"], room["height"]
            grid[y:y+room_height, x:x+room_width] = room_id + 1
        
        # Crear diccionario de posiciones de habitaciones
        room_positions = {
            room["id"]: {
                "id": room["id"],
                "name": room["name"],
                "type": room["type"],
                "x": room["x"],
                "y": room["y"],
                "width": room["width"],
                "height": room["height"],
                "color": self.room_colors.get(room["type"], "#FFFFFF")
            } for room in room_placements
        }
        
        # Método para agregar las puertas entre las habitaciones según el grafo de adyacencia
        grid, doorways = self._add_doorways(grid, room_positions, adjacency_graph)
        
        # Salida del plano
        layout_result = {
            "grid": grid.tolist(),  # Convertir array numpy a lista para serialización JSON
            "room_positions": room_positions,
            "grid_size": actual_grid_size,
            "cell_size": self.grid_cell_size,
            "rooms": rooms_data,
            "doorways": doorways
        }
        
        return layout_result

    def generate_controlnet_input(self, layout_result: Dict[str, Any], save_path: Optional[str] = None) -> plt.Figure:
        """
        Genera una imagen de plano limpia en blanco y negro binaria adecuada para entrada de ControlNet.
        - Paredes negras
        - Habitaciones blancas
        - Sin puertas
        - Sin etiquetas
        - Sin colores
        """

        grid = np.array(layout_result["grid"])
        room_positions = layout_result["room_positions"]

        fig, ax = plt.subplots(figsize=(12, 10))
        ax.set_facecolor('white')  # fondo en blanco

        # Dibujar los planos en blanco
        for room_id, room_info in room_positions.items():
            x, y = room_info["x"], room_info["y"]
            width, height = room_info["width"], room_info["height"]

            rect = plt.Rectangle((x, y), width, height, facecolor='white', edgecolor='black', linewidth=2.0)
            ax.add_patch(rect)

        ax.set_xlim(-1, grid.shape[1] + 1)
        ax.set_ylim(grid.shape[0] + 1, -1)
        ax.set_aspect('equal')
        ax.axis('off')

        # Guardar sin líneas, etiquetas ni puertas
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight', pad_inches=0, facecolor='white')

        return fig
    
    def _preprocess_rooms(self, rooms_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Procesa datos de habitaciones para incluir dimensiones e IDs."""
        processed_rooms = []
        room_id = 0
        
        for room_info in rooms_data:
            room_type = room_info["type"]
            count = room_info["count"]
            approx_sqft = room_info["approximate_sqft"]
            
            # Calcular celdas de grilla necesarias (redondeando hacia arriba)
            grid_cells = math.ceil(approx_sqft / self.grid_cell_size)
            
            # Determinar dimensiones
            default_width, default_height = self.default_room_dimensions.get(
                room_type, (3, 3))  # Valor predeterminado si no se encuentra el tipo de habitación
            
            # Escalar dimensiones basado en pies cuadrados reales
            default_area = default_width * default_height
            scale_factor = math.sqrt(grid_cells / default_area)
            
            width = max(2, round(default_width * scale_factor))
            height = max(2, round(default_height * scale_factor))
            
            # Ajustar para coincidir aproximadamente con las celdas de grilla objetivo
            while width * height < grid_cells:
                if width <= height:
                    width += 1
                else:
                    height += 1
            
            # Crear entradas para cada instancia de este tipo de habitación
            for i in range(count):
                name = room_type
                if count > 1:
                    # Para múltiples habitaciones del mismo tipo, agregar números (Dormitorio 1, Dormitorio 2, etc.)
                    if room_type == "bedroom" and i == 0 and any(r["type"] == "master bedroom" for r in rooms_data):
                        # Omitir nombrar el primer dormitorio si ya hay un dormitorio principal
                        pass
                    else:
                        name = f"{room_type} {i+1}"
                
                processed_rooms.append({
                    "id": room_id,
                    "name": name,
                    "type": room_type,
                    "width": width,
                    "height": height,
                    "grid_cells": width * height,
                    "approx_sqft": approx_sqft
                })
                room_id += 1
        
        return processed_rooms
    
    def _create_adjacency_graph(self, rooms: List[Dict[str, Any]], 
                            adjacency_info: List[Dict[str, str]]) -> nx.Graph:
        """Crea un grafo representando las adyacencias de habitaciones."""
        graph = nx.Graph()
        
        # Agregar todas las habitaciones como nodos
        for room in rooms:
            graph.add_node(room["id"], **room)
        
        # Procesar requerimientos de adyacencia explícitos
        for adj in adjacency_info:
            room1_type = adj["room1"]
            room2_type = adj["room2"]
            
            # Encontrar IDs de habitaciones que coincidan con estos tipos
            room1_ids = [r["id"] for r in rooms if r["type"] == room1_type]
            room2_ids = [r["id"] for r in rooms if r["type"] == room2_type]
            
            # Agregar aristas entre estas habitaciones
            for id1 in room1_ids:
                for id2 in room2_ids:
                    if id1 != id2:  # Evitar auto-conexiones
                        graph.add_edge(id1, id2, weight=10)  # Peso más alto para adyacencias requeridas
        
        # Agregar patrones de adyacencia comunes
        common_adjacencies = [
            ("bedroom", "bathroom"),  # Los dormitorios suelen estar cerca de los baños
            ("kitchen", "dining room"),  # Cocina cerca del comedor
            ("living room", "dining room"),  # Living cerca del comedor
            ("entryway", "living room"),  # Entrada cerca del living
            ("garage", "kitchen"),  # Garage suele tener acceso a la cocina
        ]
        
        for room1_type, room2_type in common_adjacencies:
            room1_ids = [r["id"] for r in rooms if r["type"] == room1_type]
            room2_ids = [r["id"] for r in rooms if r["type"] == room2_type]
            
            for id1 in room1_ids:
                for id2 in room2_ids:
                    if id1 != id2 and not graph.has_edge(id1, id2):
                        graph.add_edge(id1, id2, weight=5)  # Peso más bajo para adyacencias comunes
        
        # Agregar conexiones dormitorio-living con peso MUCHO más alto para asegurar adyacencia
        bedroom_ids = [r["id"] for r in rooms if r["type"] == "bedroom" or r["type"] == "master bedroom"]
        living_room_ids = [r["id"] for r in rooms if r["type"] == "living room"]
        hallway_ids = [r["id"] for r in rooms if r["type"] == "hallway"]
        
        # Conectar dormitorios con living con peso muy alto para garantizar adyacencia
        for bedroom_id in bedroom_ids:
            for living_room_id in living_room_ids:
                if bedroom_id != living_room_id:
                    # Remover cualquier arista existente para sobrescribir su peso
                    if graph.has_edge(bedroom_id, living_room_id):
                        graph.remove_edge(bedroom_id, living_room_id)
                    # Agregar arista con peso muy alto
                    graph.add_edge(bedroom_id, living_room_id, weight=20)
        
        # Conectar pasillos con living con peso muy alto para garantizar adyacencia
        for hallway_id in hallway_ids:
            for living_room_id in living_room_ids:
                if hallway_id != living_room_id:
                    # Remover cualquier arista existente para sobrescribir su peso
                    if graph.has_edge(hallway_id, living_room_id):
                        graph.remove_edge(hallway_id, living_room_id)
                    # Agregar arista con peso muy alto
                    graph.add_edge(hallway_id, living_room_id, weight=20)
        
        # Conectar pasillos con dormitorios con peso alto
        for hallway_id in hallway_ids:
            for bedroom_id in bedroom_ids:
                if hallway_id != bedroom_id and not graph.has_edge(hallway_id, bedroom_id):
                    graph.add_edge(hallway_id, bedroom_id, weight=15)
        
        # Conectar componentes desconectados - asegurar que todas las habitaciones sean accesibles
        components = list(nx.connected_components(graph))
        if len(components) > 1:
            # Conectar cada componente al componente más grande
            largest_component = max(components, key=len)
            other_components = [c for c in components if c != largest_component]
            
            for component in other_components:
                # Encontrar un nodo aleatorio de cada componente
                node1 = random.choice(list(component))
                node2 = random.choice(list(largest_component))
                graph.add_edge(node1, node2, weight=1)  # Peso bajo para aristas de conectividad
        
        return graph
    
    def _calculate_grid_size(self, total_cells: int) -> Tuple[int, int]:
        """Calcula dimensiones apropiadas de la grilla."""
        # Relación de aspecto objetivo alrededor de 4:3
        target_ratio = 4/3
        
        # Calcular ancho y alto
        width = int(math.sqrt(total_cells * target_ratio))
        height = int(total_cells / width)
        
        # Agregar buffer más pequeño para corredores y paredes
        width = int(width * 1.1)  # Reducido de 1.2
        height = int(height * 1.1)  # Reducido de 1.2
        
        # Asegurar tamaño mínimo
        width = max(width, 12)
        height = max(height, 12)
        
        return (width, height)
    
    def _place_rooms(self, rooms: List[Dict[str, Any]], 
                    graph: nx.Graph, grid_size: Tuple[int, int]) -> List[Dict[str, Any]]:
        """Ubica habitaciones en la grilla basado en requerimientos de adyacencia."""
        width, height = grid_size
        
        # Ordenar habitaciones por tamaño (más grandes primero) e importancia
        def room_priority(room):
            # Las habitaciones importantes obtienen mayor prioridad
            importance = {
                "living room": 100,
                "kitchen": 90,
                "hallway": 88,
                "master bedroom": 85,
                "bedroom": 80,
                "dining room": 75,
                "bathroom": 50
            }
            return importance.get(room["type"], 0) + room["grid_cells"]
            
        sorted_rooms = sorted(rooms, key=room_priority, reverse=True)
        
        # Inicializar grilla para verificación de ubicación
        placement_grid = np.zeros((height, width), dtype=int)
        room_placements = []
        
        # Ubicar primera (más importante) habitación cerca del centro
        first_room = sorted_rooms[0]
        center_x = width // 2 - first_room["width"] // 2
        center_y = height // 2 - first_room["height"] // 2
        
        room_placements.append({
            **first_room,
            "x": center_x,
            "y": center_y
        })
        
        # Marcar grilla como ocupada
        placement_grid[center_y:center_y+first_room["height"], 
                    center_x:center_x+first_room["width"]] = first_room["id"] + 1
        
        # Ubicar habitaciones restantes
        remaining_rooms = sorted_rooms[1:]
        placed_room_ids = {first_room["id"]}
        
        # Agregar factor de aleatorización para crear variación en los planos
        random_seed = random.randint(1, 1000)
        random.seed(random_seed)
        
        while remaining_rooms:
            best_score = -float('inf')
            best_placement = None
            best_room_idx = 0
            
            # Intentar cada habitación restante
            for i, room in enumerate(remaining_rooms):
                # Encontrar habitaciones adyacentes ya ubicadas
                adjacent_rooms = []
                for adj_id in graph.neighbors(room["id"]):
                    if adj_id in placed_room_ids:
                        adjacent_rooms.append(adj_id)
                
                # Si no hay habitaciones adyacentes ubicadas aún, saltar por ahora
                if not adjacent_rooms and len(placed_room_ids) < len(rooms) // 2:
                    continue
                
                # Agregar algo de aleatoriedad al patrón de búsqueda
                start_y = random.randint(0, min(3, height - room["height"]))
                start_x = random.randint(0, min(3, width - room["width"]))
                
                # Intentar todas las posiciones posibles en un orden ligeramente aleatorizado
                for y_offset in range(height - room["height"] + 1):
                    y = (start_y + y_offset) % (height - room["height"] + 1)
                    for x_offset in range(width - room["width"] + 1):
                        x = (start_x + x_offset) % (width - room["width"] + 1)
                        
                        # Verificar si el área está libre
                        area = placement_grid[y:y+room["height"], x:x+room["width"]]
                        if np.any(area > 0):
                            continue
                        
                        # Calcular puntaje basado en adyacencia y posición
                        score = self._calculate_placement_score(
                            room, x, y, placement_grid, room_placements, graph)
                        
                        # Agregar pequeña variación aleatoria al puntaje para prevenir planos idénticos
                        score += random.uniform(-0.5, 0.5)
                        
                        if score > best_score:
                            best_score = score
                            best_placement = (x, y)
                            best_room_idx = i
            
            # Si se encontró una ubicación válida
            if best_placement:
                x, y = best_placement
                room = remaining_rooms[best_room_idx]
                
                # Ubicar la habitación
                room_placements.append({
                    **room,
                    "x": x,
                    "y": y
                })
                placement_grid[y:y+room["height"], x:x+room["width"]] = room["id"] + 1
                placed_room_ids.add(room["id"])
                
                # Remover de habitaciones restantes
                remaining_rooms.pop(best_room_idx)
            else:
                # Si no se encontró ubicación válida, tomar la primera habitación restante
                # y ubicarla en la primera posición disponible
                room = remaining_rooms[0]
                
                for y in range(height - room["height"] + 1):
                    placed = False
                    for x in range(width - room["width"] + 1):
                        area = placement_grid[y:y+room["height"], x:x+room["width"]]
                        if not np.any(area > 0):
                            room_placements.append({
                                **room,
                                "x": x,
                                "y": y
                            })
                            placement_grid[y:y+room["height"], x:x+room["width"]] = room["id"] + 1
                            placed_room_ids.add(room["id"])
                            placed = True
                            break
                    if placed:
                        break
                        
                remaining_rooms.pop(0)
        
        # Comprimir plano removiendo filas y columnas vacías
        min_x = width
        min_y = height
        max_x = 0
        max_y = 0
        
        # Encontrar los límites reales de las habitaciones ubicadas
        for room in room_placements:
            min_x = min(min_x, room["x"])
            min_y = min(min_y, room["y"])
            max_x = max(max_x, room["x"] + room["width"])
            max_y = max(max_y, room["y"] + room["height"])
            
        # Ajustar todas las posiciones de habitaciones para remover espacio vacío
        for room in room_placements:
            room["x"] -= min_x
            room["y"] -= min_y
        
        return room_placements
    
    def _calculate_placement_score(self, room: Dict[str, Any], x: int, y: int,
                                grid: np.ndarray, placed_rooms: List[Dict[str, Any]],
                                graph: nx.Graph) -> float:
        """Calcula qué tan buena es una ubicación basado en adyacencia y otros factores."""
        score = 0
        room_id = room["id"]
        room_w, room_h = room["width"], room["height"]
        grid_height, grid_width = grid.shape
        
        # PUNTAJE DE ADYACENCIA
        # ====================
        
        # Rastrear si se satisfacen las adyacencias requeridas
        adjacency_satisfied = {}
        
        # Obtener todas las habitaciones que deberían ser adyacentes a esta
        required_adjacencies = []
        for neighbor_id in graph.neighbors(room_id):
            weight = graph.get_edge_data(room_id, neighbor_id)["weight"]
            if weight >= 10:  # Solo considerar aristas de alto peso como requeridas
                required_adjacencies.append((neighbor_id, weight))
        
        # Verificar cada habitación ubicada
        for placed_room in placed_rooms:
            placed_id = placed_room["id"]
            px, py = placed_room["x"], placed_room["y"]
            pw, ph = placed_room["width"], placed_room["height"]
            
            # Verificar si estas habitaciones deberían ser adyacentes
            edge_weight = 0
            if graph.has_edge(room_id, placed_id):
                edge_weight = graph.get_edge_data(room_id, placed_id)["weight"]
                
                # Rastrear si esta es una adyacencia requerida
                if edge_weight >= 10:
                    adjacency_satisfied[placed_id] = False
            
            # Calcular distancia de superposición para cada borde
            # Adyacencia horizontal (izquierda/derecha)
            if (y < py + ph and y + room_h > py):
                # Habitación a la izquierda
                if x + room_w == px:
                    score += edge_weight * 15  # Bonus fuerte para adyacencia horizontal
                    if edge_weight >= 10:
                        adjacency_satisfied[placed_id] = True
                # Habitación a la derecha
                elif px + pw == x:
                    score += edge_weight * 15  # Bonus fuerte para adyacencia horizontal
                    if edge_weight >= 10:
                        adjacency_satisfied[placed_id] = True
            
            # Adyacencia vertical (arriba/abajo)
            if (x < px + pw and x + room_w > px):
                # Habitación arriba
                if y + room_h == py:
                    score += edge_weight * 15  # Bonus fuerte para adyacencia vertical
                    if edge_weight >= 10:
                        adjacency_satisfied[placed_id] = True
                # Habitación abajo
                elif py + ph == y:
                    score += edge_weight * 15  # Bonus fuerte para adyacencia vertical
                    if edge_weight >= 10:
                        adjacency_satisfied[placed_id] = True
            
            # Penalizar habitaciones superpuestas (no debería ocurrir debido a verificación anterior)
            if (x < px + pw and x + room_w > px and
                y < py + ph and y + room_h > py):
                score -= 1000
            
            # Penalizar habitaciones que están lejos de vecinos deseados
            if edge_weight > 0:
                center_dist = math.sqrt(
                    (x + room_w/2 - (px + pw/2))**2 + 
                    (y + room_h/2 - (py + ph/2))**2
                )
                score -= center_dist * edge_weight * 0.5
        
        # Bonus especial para pasillos
        if room["type"] == "hallway":
            # Fomentar que los pasillos estén más centrales
            center_x, center_y = grid_width // 2, grid_height // 2
            distance_to_center = math.sqrt(
                (x + room_w/2 - center_x)**2 + 
                (y + room_h/2 - center_y)**2
            )
            # Bonus por estar más cerca del centro
            score += 50 * (1 - distance_to_center / (grid_width + grid_height))
        
        # Bonus extra para adyacencias de living
        if room["type"] == "living room":
            # Fomentar que el living esté más central
            score += 30
        elif room["type"] in ["bedroom", "master bedroom"]:
            # Verificar si este dormitorio tiene una adyacencia de living 
            # satisfecha, dar bonus mayor si es así
            for placed_room in placed_rooms:
                if placed_room["type"] == "living room" and adjacency_satisfied.get(placed_room["id"], False):
                    score += 100  # Bonus mayor para dormitorio con adyacencia de living
        
        # Evitar borde de grilla ligeramente
        if x == 0 or y == 0 or x + room_w == grid_width or y + room_h == grid_height:
            score -= 5
        
        return score
    
    def _create_grid(self, room_placements: List[Dict[str, Any]], 
                 grid_size: Tuple[int, int]) -> Tuple[np.ndarray, Dict[int, Dict]]:
        """Crea una representación de grilla del plano."""
        width, height = grid_size
        
        # Inicializar grilla con ceros (espacio vacío)
        grid = np.zeros((height, width), dtype=int)
        
        # Diccionario para almacenar posiciones de habitaciones y metadatos
        room_positions = {}
        
        # Ubicar cada habitación en la grilla
        for room in room_placements:
            room_id = room["id"]
            x, y = room["x"], room["y"]
            room_width, room_height = room["width"], room["height"]
            
            # Marcar área de habitación en grilla con ID de habitación + 1 (0 está reservado para espacio vacío)
            grid[y:y+room_height, x:x+room_width] = room_id + 1
            
            # Almacenar posición de habitación e información
            room_positions[room_id] = {
                "id": room_id,
                "name": room["name"],
                "type": room["type"],
                "x": x,
                "y": y,
                "width": room_width,
                "height": room_height,
                "color": self.room_colors.get(room["type"], "#FFFFFF")
            }
        
        return grid, room_positions
    
    def _add_doorways(self, grid: np.ndarray, room_positions: Dict[int, Dict],
                    adjacency_graph: nx.Graph) -> (np.ndarray, list):
        """Agrega puertas entre habitaciones adyacentes y devuelve también la lista de puertas con orientación."""
        height, width = grid.shape
        grid_with_doors = grid.copy()
        doorway_value = -1
        edges = [(u, v, adjacency_graph[u][v]['weight']) for u, v in adjacency_graph.edges()]
        edges.sort(key=lambda x: x[2], reverse=True)
        room_has_doorway = {room_id: 0 for room_id in room_positions}
        doorways = []  # Lista de puertas con orientación
        for room1_id, room2_id, weight in edges:
            if weight < 3:
                continue
            if room1_id not in room_positions or room2_id not in room_positions:
                continue
            room1 = room_positions[room1_id]
            room2 = room_positions[room2_id]
            doorway_candidates = []
            # Habitación 1 a la izquierda de Habitación 2
            if room1["x"] + room1["width"] == room2["x"]:
                y_min = max(room1["y"], room2["y"])
                y_max = min(room1["y"] + room1["height"], room2["y"] + room2["height"])
                if y_max > y_min:
                    door_y = y_min + (y_max - y_min) // 2
                    if (grid_with_doors[door_y, room1["x"] + room1["width"] - 1] == room1_id + 1 and
                        grid_with_doors[door_y, room2["x"]] == room2_id + 1):
                        doorway_candidates.append((room2["x"], door_y, 'vertical'))
            # Habitación 1 a la derecha de Habitación 2
            elif room2["x"] + room2["width"] == room1["x"]:
                y_min = max(room1["y"], room2["y"])
                y_max = min(room1["y"] + room1["height"], room2["y"] + room2["height"])
                if y_max > y_min:
                    door_y = y_min + (y_max - y_min) // 2
                    if (grid_with_doors[door_y, room1["x"]] == room1_id + 1 and
                        grid_with_doors[door_y, room2["x"] + room2["width"] - 1] == room2_id + 1):
                        doorway_candidates.append((room1["x"], door_y, 'vertical'))
            # Habitación 1 arriba de Habitación 2
            elif room1["y"] + room1["height"] == room2["y"]:
                x_min = max(room1["x"], room2["x"])
                x_max = min(room1["x"] + room1["width"], room2["x"] + room2["width"])
                if x_max > x_min:
                    door_x = x_min + (x_max - x_min) // 2
                    if (grid_with_doors[room1["y"] + room1["height"] - 1, door_x] == room1_id + 1 and
                        grid_with_doors[room2["y"], door_x] == room2_id + 1):
                        doorway_candidates.append((door_x, room2["y"], 'horizontal'))
            # Habitación 1 abajo de Habitación 2
            elif room2["y"] + room2["height"] == room1["y"]:
                x_min = max(room1["x"], room2["x"])
                x_max = min(room1["x"] + room1["width"], room2["x"] + room2["width"])
                if x_max > x_min:
                    door_x = x_min + (x_max - x_min) // 2
                    if (grid_with_doors[room1["y"], door_x] == room1_id + 1 and
                        grid_with_doors[room2["y"] + room2["height"] - 1, door_x] == room2_id + 1):
                        doorway_candidates.append((door_x, room1["y"], 'horizontal'))
            if doorway_candidates:
                door_x, door_y, orientation = doorway_candidates[0]
                if (room1["type"] == "hallway" or room2["type"] == "hallway" or
                    room_has_doorway[room1_id] < 3 and room_has_doorway[room2_id] < 3):
                    grid_with_doors[door_y, door_x] = doorway_value
                    room_has_doorway[room1_id] += 1
                    room_has_doorway[room2_id] += 1
                    doorways.append({"x": door_x, "y": door_y, "orientation": orientation})
        return grid_with_doors, doorways
    
    def visualize_layout(self, layout_result: Dict[str, Any], save_path: Optional[str] = None, show_labels: bool = True) -> plt.Figure:
        grid = np.array(layout_result["grid"])
        room_positions = layout_result["room_positions"]
        doorways = layout_result.get("doorways", [])
        fig, ax = plt.subplots(figsize=(12, 10))
        ax.set_facecolor('#F5F5F5')
        # Dibujar habitaciones
        for room_id, room_info in room_positions.items():
            x, y = room_info["x"], room_info["y"]
            width, height = room_info["width"], room_info["height"]
            color = room_info["color"]
            rect = plt.Rectangle((x, y), width, height, facecolor=color, edgecolor='black', linewidth=1.5)
            ax.add_patch(rect)
            if show_labels:
                ax.text(x + width/2, y + height/2, room_info["name"].upper(), 
                        ha='center', va='center', fontsize=7, fontweight='bold', color='black')
        # Dibujar puertas usando la lista de doorways
        for doorway in doorways:
            x, y, orientation = doorway["x"], doorway["y"], doorway["orientation"]
            if orientation == 'vertical':
                door_rect = plt.Rectangle((x - 0.05, y - 0.5), 0.1, 1.0, facecolor='white', edgecolor='black', linewidth=0.8)
                ax.add_patch(door_rect)
            elif orientation == 'horizontal':
                door_rect = plt.Rectangle((x - 0.5, y - 0.05), 1.0, 0.1, facecolor='white', edgecolor='black', linewidth=0.8)
                ax.add_patch(door_rect)
        height, width = grid.shape
        ax.set_xlim(-1, width + 1)
        ax.set_ylim(height + 1, -1)
        ax.set_aspect('equal')
        ax.axis('off')
        if show_labels:
            pass
        else:
            pass
        ax.grid(True, color='gray', linestyle='--', linewidth=0.5, alpha=0.3)
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
        return fig

    
    def generate_layout_json(self, layout_result: Dict[str, Any]) -> str:
        """
        Genera una representación JSON del plano para uso con el módulo de renderizado.
        
        Args:
            layout_result: El plano generado por generate_layout()
            
        Returns:
            Representación en string JSON
        """
        import json
        
        # Convertir arrays numpy a listas
        serializable_result = {
            "grid": layout_result["grid"].tolist() if isinstance(layout_result["grid"], np.ndarray) 
                    else layout_result["grid"],
            "room_positions": layout_result["room_positions"],
            "grid_size": layout_result["grid_size"],
            "cell_size": layout_result["cell_size"],
            "rooms": layout_result["rooms"],
            "doorways": layout_result["doorways"]
        }
        
        return json.dumps(serializable_result, indent=2)
    
    def generate_svg_representation(self, layout_result: Dict[str, Any]) -> str:
        """
        Genera una representación SVG del plano.
        
        Args:
            layout_result: El plano generado por generate_layout()
            
        Returns:
            Representación en string SVG
        """
        grid = np.array(layout_result["grid"]) if not isinstance(layout_result["grid"], np.ndarray) else layout_result["grid"]
        room_positions = layout_result["room_positions"]
        
        # Parámetros SVG
        cell_size = 30  # píxeles por celda
        height, width = grid.shape
        svg_width = width * cell_size
        svg_height = height * cell_size
        
        # Iniciar SVG
        svg = [f'<svg width="{svg_width}" height="{svg_height}" viewBox="0 0 {svg_width} {svg_height}" xmlns="http://www.w3.org/2000/svg">']
        
        # Fondo
        svg.append(f'<rect width="{svg_width}" height="{svg_height}" fill="#F5F5F5" />')
        
        # Dibujar habitaciones
        for room_id, room_info in room_positions.items():
            x, y = room_info["x"], room_info["y"]
            room_width, room_height = room_info["width"], room_info["height"]
            color = room_info["color"]
            
            # Convertir a coordenadas SVG
            svg_x = x * cell_size
            svg_y = y * cell_size
            svg_width = room_width * cell_size
            svg_height = room_height * cell_size
            
            # Agregar rectángulo de habitación
            svg.append(f'<rect x="{svg_x}" y="{svg_y}" width="{svg_width}" height="{svg_height}" '
                    f'fill="{color}" stroke="black" stroke-width="2" />')
            
            # Agregar etiqueta de habitación
            text_x = svg_x + svg_width / 2
            text_y = svg_y + svg_height / 2
            svg.append(f'<text x="{text_x}" y="{text_y}" font-family="Arial" font-size="12" '
                    f'font-weight="bold" text-anchor="middle" dominant-baseline="middle">'
                    f'{room_info["name"]}</text>')
        
        # Dibujar puertas - ajustar el tamaño para representar mejor las puertas
        door_size = cell_size * 0.8  # Símbolo de puerta ligeramente más grande
        for y in range(height):
            for x in range(width):
                if grid[y, x] == -1:  # Puerta
                    door_x = x * cell_size - door_size / 2 + cell_size / 2
                    door_y = y * cell_size - door_size / 2 + cell_size / 2
                    
                    svg.append(f'<rect x="{door_x}" y="{door_y}" width="{door_size}" height="{door_size}" '
                            f'fill="white" stroke="black" stroke-width="1.5" />')
        
        # Agregar líneas de grilla (opcional - comentar si no se quieren líneas de grilla)
        for i in range(width + 1):
            x = i * cell_size
            svg.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{height * cell_size}" '
                    f'stroke="gray" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.3" />')
        
        for i in range(height + 1):
            y = i * cell_size
            svg.append(f'<line x1="0" y1="{y}" x2="{width * cell_size}" y2="{y}" '
                    f'stroke="gray" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.3" />')
        
        # Cerrar SVG
        svg.append('</svg>')
        
        return '\n'.join(svg)