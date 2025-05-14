import numpy as np
import matplotlib.pyplot as plt
from typing import Dict, List, Tuple, Any, Optional
import random
import networkx as nx
import math
import time

class LayoutGenerationModule:
    def __init__(self):
        # Room size multipliers to convert sq ft to grid cells
        # Assuming 1 grid cell = 20 sq ft (adjustable)
        self.grid_cell_size = 20  # sq ft per cell
        
        # Common doorway patterns (relative coordinates)
        self.doorway_patterns = [
            [(0, 0), (1, 0)],  # horizontal doorway
            [(0, 0), (0, 1)]   # vertical doorway
        ]
        
        # Room color map for visualization
        self.room_colors = {
            "bedroom": "#C5D8FF",        # Light blue
            "bathroom": "#AEE1FF",       # Sky blue
            "kitchen": "#FFCBA4",        # Peach
            "living room": "#D7FFD7",    # Light green
            "dining room": "#FFD7D7",    # Light pink
            "garage": "#DADADA",         # Light gray
            "laundry room": "#D4F0F0",   # Light cyan
            "entryway": "#FFE4B5",      # Light goldenrod
        }
        
        # Default room dimensions (in grid cells)
        # These are starting suggestions that will be adjusted based on sq footage
        self.default_room_dimensions = {
            "bedroom": (4, 4),         # 16 cells * 20 sq ft = 320 sq ft
            "bathroom": (2, 3),        # 6 cells * 20 sq ft = 120 sq ft
            "kitchen": (4, 3),         # 12 cells * 20 sq ft = 240 sq ft
            "living room": (5, 5),     # 25 cells * 20 sq ft = 500 sq ft
            "dining room": (4, 4),     # 16 cells * 20 sq ft = 320 sq ft
            "garage": (5, 5),          # 25 cells * 20 sq ft = 500 sq ft
            "laundry room": (2, 2),    # 4 cells * 20 sq ft = 80 sq ft
            "entryway": (3, 3),      # 9 cells * 20 sq ft = 180 sq ft
        }
    
    def generate_layout(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a layout based on the requirements from the text understanding module.
        
        Args:
            requirements: Structured data about the floor plan requirements
            
        Returns:
            Dictionary containing the generated layout
        """
        # Add randomness to ensure different layouts on each run
        random.seed(int(time.time()))
        
        # Extract room data
        rooms_data = self._preprocess_rooms(requirements["rooms"])
        
        # Create room adjacency graph
        adjacency_graph = self._create_adjacency_graph(rooms_data, requirements.get("adjacency", []))
        
        # Determine grid size based on total area
        total_cells = sum(room["grid_cells"] for room in rooms_data)
        grid_size = self._calculate_grid_size(total_cells)
        
        # Place rooms using a graph-based approach with randomization
        room_placements = self._place_rooms(rooms_data, adjacency_graph, grid_size)
        
        # Get actual size needed after placing all rooms
        max_x = max(r["x"] + r["width"] for r in room_placements)
        max_y = max(r["y"] + r["height"] for r in room_placements)
        actual_grid_size = (max_x, max_y)
        
        # Create grid representation with the actual size needed
        grid = np.zeros((max_y, max_x), dtype=int)
        for room in room_placements:
            room_id = room["id"]
            x, y = room["x"], room["y"]
            room_width, room_height = room["width"], room["height"]
            grid[y:y+room_height, x:x+room_width] = room_id + 1
        
        # Create room positions dict
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
        
        # Create doorways between adjacent rooms
        grid = self._add_doorways(grid, room_positions, adjacency_graph)
        
        # Package results
        layout_result = {
            "grid": grid.tolist(),  # Convert numpy array to list for JSON serialization
            "room_positions": room_positions,
            "grid_size": actual_grid_size,
            "cell_size": self.grid_cell_size,
            "rooms": rooms_data
        }
        
        return layout_result

    def generate_controlnet_input(self, layout_result: Dict[str, Any], save_path: Optional[str] = None) -> plt.Figure:
        """
        Generate a clean black & white binary layout image suitable for ControlNet input.
        - Black walls
        - White rooms
        - No doors
        - No labels
        - No colors
        """

        grid = np.array(layout_result["grid"])
        room_positions = layout_result["room_positions"]

        fig, ax = plt.subplots(figsize=(12, 10))
        ax.set_facecolor('white')  # Background white

        # Draw rooms (white)
        for room_id, room_info in room_positions.items():
            x, y = room_info["x"], room_info["y"]
            width, height = room_info["width"], room_info["height"]

            rect = plt.Rectangle((x, y), width, height, facecolor='white', edgecolor='black', linewidth=2.0)
            ax.add_patch(rect)

        ax.set_xlim(-1, grid.shape[1] + 1)
        ax.set_ylim(grid.shape[0] + 1, -1)
        ax.set_aspect('equal')
        ax.axis('off')

        # No gridlines, no labels, no doors

        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight', pad_inches=0, facecolor='white')

        return fig
    
    def _preprocess_rooms(self, rooms_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process room data to include dimensions and IDs."""
        processed_rooms = []
        room_id = 0
        
        for room_info in rooms_data:
            room_type = room_info["type"]
            count = room_info["count"]
            approx_sqft = room_info["approximate_sqft"]
            
            # Calculate grid cells needed (rounding up)
            grid_cells = math.ceil(approx_sqft / self.grid_cell_size)
            
            # Determine dimensions
            default_width, default_height = self.default_room_dimensions.get(
                room_type, (3, 3))  # Default if room type not found
            
            # Scale dimensions based on actual square footage
            default_area = default_width * default_height
            scale_factor = math.sqrt(grid_cells / default_area)
            
            width = max(2, round(default_width * scale_factor))
            height = max(2, round(default_height * scale_factor))
            
            # Adjust to match target grid cells approximately
            while width * height < grid_cells:
                if width <= height:
                    width += 1
                else:
                    height += 1
            
            # Create entries for each instance of this room type
            for i in range(count):
                name = room_type
                if count > 1:
                    # For multiple rooms of same type, add numbers (Bedroom 1, Bedroom 2, etc.)
                    if room_type == "bedroom" and i == 0 and any(r["type"] == "master bedroom" for r in rooms_data):
                        # Skip naming first bedroom if there's already a master bedroom
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
        """Create a graph representing room adjacencies."""
        graph = nx.Graph()
        
        # Add all rooms as nodes
        for room in rooms:
            graph.add_node(room["id"], **room)
        
        # Process explicit adjacency requirements
        for adj in adjacency_info:
            room1_type = adj["room1"]
            room2_type = adj["room2"]
            
            # Find room IDs matching these types
            room1_ids = [r["id"] for r in rooms if r["type"] == room1_type]
            room2_ids = [r["id"] for r in rooms if r["type"] == room2_type]
            
            # Add edges between these rooms
            for id1 in room1_ids:
                for id2 in room2_ids:
                    if id1 != id2:  # Avoid self-loops
                        graph.add_edge(id1, id2, weight=10)  # Higher weight for required adjacencies
        
        # Add common adjacency patterns
        common_adjacencies = [
            ("bedroom", "bathroom"),  # Bedrooms often near bathrooms
            ("kitchen", "dining room"),  # Kitchen near dining room
            ("living room", "dining room"),  # Living room near dining room
            ("entryway", "living room"),  # Entry near living room
            ("garage", "kitchen"),  # Garage often has access to kitchen
        ]
        
        for room1_type, room2_type in common_adjacencies:
            room1_ids = [r["id"] for r in rooms if r["type"] == room1_type]
            room2_ids = [r["id"] for r in rooms if r["type"] == room2_type]
            
            for id1 in room1_ids:
                for id2 in room2_ids:
                    if id1 != id2 and not graph.has_edge(id1, id2):
                        graph.add_edge(id1, id2, weight=5)  # Lower weight for common adjacencies
        
        # Add bedroom-to-living room connections with MUCH higher weight to ensure adjacency
        bedroom_ids = [r["id"] for r in rooms if r["type"] == "bedroom" or r["type"] == "master bedroom"]
        living_room_ids = [r["id"] for r in rooms if r["type"] == "living room"]
        hallway_ids = [r["id"] for r in rooms if r["type"] == "hallway"]
        
        # Connect bedrooms to living rooms with very high weight to guarantee adjacency
        for bedroom_id in bedroom_ids:
            for living_room_id in living_room_ids:
                if bedroom_id != living_room_id:
                    # Remove any existing edge to override its weight
                    if graph.has_edge(bedroom_id, living_room_id):
                        graph.remove_edge(bedroom_id, living_room_id)
                    # Add edge with very high weight
                    graph.add_edge(bedroom_id, living_room_id, weight=20)
        
        # Connect hallways to living rooms with very high weight to guarantee adjacency
        for hallway_id in hallway_ids:
            for living_room_id in living_room_ids:
                if hallway_id != living_room_id:
                    # Remove any existing edge to override its weight
                    if graph.has_edge(hallway_id, living_room_id):
                        graph.remove_edge(hallway_id, living_room_id)
                    # Add edge with very high weight
                    graph.add_edge(hallway_id, living_room_id, weight=20)
        
        # Connect hallways to bedrooms with high weight
        for hallway_id in hallway_ids:
            for bedroom_id in bedroom_ids:
                if hallway_id != bedroom_id and not graph.has_edge(hallway_id, bedroom_id):
                    graph.add_edge(hallway_id, bedroom_id, weight=15)
        
        # Connect disconnected components - ensure all rooms are reachable
        components = list(nx.connected_components(graph))
        if len(components) > 1:
            # Connect each component to the largest component
            largest_component = max(components, key=len)
            other_components = [c for c in components if c != largest_component]
            
            for component in other_components:
                # Find a random node from each component
                node1 = random.choice(list(component))
                node2 = random.choice(list(largest_component))
                graph.add_edge(node1, node2, weight=1)  # Low weight for connectivity edges
        
        return graph
    
    def _calculate_grid_size(self, total_cells: int) -> Tuple[int, int]:
        """Calculate appropriate grid dimensions."""
        # Target aspect ratio around 4:3
        target_ratio = 4/3
        
        # Calculate width and height
        width = int(math.sqrt(total_cells * target_ratio))
        height = int(total_cells / width)
        
        # Add smaller buffer for corridors and walls
        width = int(width * 1.1)  # Reduced from 1.2
        height = int(height * 1.1)  # Reduced from 1.2
        
        # Ensure minimum size
        width = max(width, 12)
        height = max(height, 12)
        
        return (width, height)
    
    def _place_rooms(self, rooms: List[Dict[str, Any]], 
                    graph: nx.Graph, grid_size: Tuple[int, int]) -> List[Dict[str, Any]]:
        """Place rooms on the grid based on adjacency requirements."""
        width, height = grid_size
        
        # Sort rooms by size (largest first) and importance
        def room_priority(room):
            # Important rooms get higher priority
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
        
        # Initialize grid for placement check
        placement_grid = np.zeros((height, width), dtype=int)
        room_placements = []
        
        # Place first (most important) room near the center
        first_room = sorted_rooms[0]
        center_x = width // 2 - first_room["width"] // 2
        center_y = height // 2 - first_room["height"] // 2
        
        room_placements.append({
            **first_room,
            "x": center_x,
            "y": center_y
        })
        
        # Mark grid as occupied
        placement_grid[center_y:center_y+first_room["height"], 
                    center_x:center_x+first_room["width"]] = first_room["id"] + 1
        
        # Place remaining rooms
        remaining_rooms = sorted_rooms[1:]
        placed_room_ids = {first_room["id"]}
        
        # Add randomization factor to create variation in layouts
        random_seed = random.randint(1, 1000)
        random.seed(random_seed)
        
        while remaining_rooms:
            best_score = -float('inf')
            best_placement = None
            best_room_idx = 0
            
            # Try each remaining room
            for i, room in enumerate(remaining_rooms):
                # Find adjacent rooms already placed
                adjacent_rooms = []
                for adj_id in graph.neighbors(room["id"]):
                    if adj_id in placed_room_ids:
                        adjacent_rooms.append(adj_id)
                
                # If no adjacent rooms placed yet, skip for now
                if not adjacent_rooms and len(placed_room_ids) < len(rooms) // 2:
                    continue
                
                # Add some randomness to the search pattern
                start_y = random.randint(0, min(3, height - room["height"]))
                start_x = random.randint(0, min(3, width - room["width"]))
                
                # Try all possible positions in a slightly randomized order
                for y_offset in range(height - room["height"] + 1):
                    y = (start_y + y_offset) % (height - room["height"] + 1)
                    for x_offset in range(width - room["width"] + 1):
                        x = (start_x + x_offset) % (width - room["width"] + 1)
                        
                        # Check if area is free
                        area = placement_grid[y:y+room["height"], x:x+room["width"]]
                        if np.any(area > 0):
                            continue
                        
                        # Calculate score based on adjacency and position
                        score = self._calculate_placement_score(
                            room, x, y, placement_grid, room_placements, graph)
                        
                        # Add small random variation to score to prevent identical layouts
                        score += random.uniform(-0.5, 0.5)
                        
                        if score > best_score:
                            best_score = score
                            best_placement = (x, y)
                            best_room_idx = i
            
            # If found a valid placement
            if best_placement:
                x, y = best_placement
                room = remaining_rooms[best_room_idx]
                
                # Place the room
                room_placements.append({
                    **room,
                    "x": x,
                    "y": y
                })
                placement_grid[y:y+room["height"], x:x+room["width"]] = room["id"] + 1
                placed_room_ids.add(room["id"])
                
                # Remove from remaining rooms
                remaining_rooms.pop(best_room_idx)
            else:
                # If no valid placement found, take the first remaining room
                # and place it at the first available position
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
        
        # Compress layout by removing empty rows and columns
        min_x = width
        min_y = height
        max_x = 0
        max_y = 0
        
        # Find the actual bounds of the placed rooms
        for room in room_placements:
            min_x = min(min_x, room["x"])
            min_y = min(min_y, room["y"])
            max_x = max(max_x, room["x"] + room["width"])
            max_y = max(max_y, room["y"] + room["height"])
            
        # Adjust all room positions to remove empty space
        for room in room_placements:
            room["x"] -= min_x
            room["y"] -= min_y
        
        return room_placements
    
    def _calculate_placement_score(self, room: Dict[str, Any], x: int, y: int,
                                grid: np.ndarray, placed_rooms: List[Dict[str, Any]],
                                graph: nx.Graph) -> float:
        """Calculate how good a placement is based on adjacency and other factors."""
        score = 0
        room_id = room["id"]
        room_w, room_h = room["width"], room["height"]
        grid_height, grid_width = grid.shape
        
        # ADJACENCY SCORING
        # ================
        
        # Track if required adjacencies are satisfied
        adjacency_satisfied = {}
        
        # Get all rooms that should be adjacent to this one
        required_adjacencies = []
        for neighbor_id in graph.neighbors(room_id):
            weight = graph.get_edge_data(room_id, neighbor_id)["weight"]
            if weight >= 10:  # Only consider high-weight edges as required
                required_adjacencies.append((neighbor_id, weight))
        
        # Check each placed room
        for placed_room in placed_rooms:
            placed_id = placed_room["id"]
            px, py = placed_room["x"], placed_room["y"]
            pw, ph = placed_room["width"], placed_room["height"]
            
            # Check if these rooms should be adjacent
            edge_weight = 0
            if graph.has_edge(room_id, placed_id):
                edge_weight = graph.get_edge_data(room_id, placed_id)["weight"]
                
                # Track if this is a required adjacency
                if edge_weight >= 10:
                    adjacency_satisfied[placed_id] = False
            
            # Calculate overlap distance for each edge
            # Horizontal adjacency (left/right)
            if (y < py + ph and y + room_h > py):
                # Room to the left
                if x + room_w == px:
                    score += edge_weight * 15  # Strong bonus for horizontal adjacency
                    if edge_weight >= 10:
                        adjacency_satisfied[placed_id] = True
                # Room to the right
                elif px + pw == x:
                    score += edge_weight * 15  # Strong bonus for horizontal adjacency
                    if edge_weight >= 10:
                        adjacency_satisfied[placed_id] = True
            
            # Vertical adjacency (above/below)
            if (x < px + pw and x + room_w > px):
                # Room above
                if y + room_h == py:
                    score += edge_weight * 15  # Strong bonus for vertical adjacency
                    if edge_weight >= 10:
                        adjacency_satisfied[placed_id] = True
                # Room below
                elif py + ph == y:
                    score += edge_weight * 15  # Strong bonus for vertical adjacency
                    if edge_weight >= 10:
                        adjacency_satisfied[placed_id] = True
            
            # Penalize overlapping rooms (shouldn't happen due to earlier check)
            if (x < px + pw and x + room_w > px and
                y < py + ph and y + room_h > py):
                score -= 1000
            
            # Penalize rooms that are far from desired neighbors
            if edge_weight > 0:
                center_dist = math.sqrt(
                    (x + room_w/2 - (px + pw/2))**2 + 
                    (y + room_h/2 - (py + ph/2))**2
                )
                score -= center_dist * edge_weight * 0.5
        
        # Special bonus for hallways
        if room["type"] == "hallway":
            # Encourage hallways to be more central
            center_x, center_y = grid_width // 2, grid_height // 2
            distance_to_center = math.sqrt(
                (x + room_w/2 - center_x)**2 + 
                (y + room_h/2 - center_y)**2
            )
            # Bonus for being closer to center
            score += 50 * (1 - distance_to_center / (grid_width + grid_height))
        
        # Extra bonus for living room adjacencies
        if room["type"] == "living room":
            # Encourage living room to be more central
            score += 30
        elif room["type"] in ["bedroom", "master bedroom"]:
            # Check if this bedroom has a living room adjacency 
            # satisfied, give major bonus if yes
            for placed_room in placed_rooms:
                if placed_room["type"] == "living room" and adjacency_satisfied.get(placed_room["id"], False):
                    score += 100  # Major bonus for bedroom with living room adjacency
        
        # Avoid edge of grid slightly
        if x == 0 or y == 0 or x + room_w == grid_width or y + room_h == grid_height:
            score -= 5
        
        return score
    
    def _create_grid(self, room_placements: List[Dict[str, Any]], 
                 grid_size: Tuple[int, int]) -> Tuple[np.ndarray, Dict[int, Dict]]:
        """Create a grid representation of the floor plan."""
        width, height = grid_size
        
        # Initialize grid with zeros (empty space)
        grid = np.zeros((height, width), dtype=int)
        
        # Dictionary to store room positions and metadata
        room_positions = {}
        
        # Place each room on the grid
        for room in room_placements:
            room_id = room["id"]
            x, y = room["x"], room["y"]
            room_width, room_height = room["width"], room["height"]
            
            # Mark room area in grid with room ID + 1 (0 is reserved for empty space)
            grid[y:y+room_height, x:x+room_width] = room_id + 1
            
            # Store room position and info
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
                    adjacency_graph: nx.Graph) -> np.ndarray:
        """Add doorways between adjacent rooms."""
        height, width = grid.shape
        
        # Create a copy of the grid to work with
        grid_with_doors = grid.copy()
        
        # Special value for doorways
        doorway_value = -1
        
        # Process each edge in the adjacency graph by order of edge weight (highest first)
        edges = [(u, v, adjacency_graph[u][v]['weight']) for u, v in adjacency_graph.edges()]
        
        # Sort edges by weight, highest first
        edges.sort(key=lambda x: x[2], reverse=True)
        
        # Track which rooms have doorways to avoid excess doors
        room_has_doorway = {room_id: 0 for room_id in room_positions}
        
        # Process edges in order of importance
        for room1_id, room2_id, weight in edges:
            # Skip if weight is too low (non-physical adjacency)
            if weight < 3:  # Skip connections with very low weights
                continue
            
            # Get room information
            if room1_id not in room_positions or room2_id not in room_positions:
                continue
                
            room1 = room_positions[room1_id]
            room2 = room_positions[room2_id]
            
            # Check if rooms are physically adjacent
            doorway_candidates = []
            
            # Room 1 to the left of Room 2
            if room1["x"] + room1["width"] == room2["x"]:
                # Find overlapping y-range
                y_min = max(room1["y"], room2["y"])
                y_max = min(room1["y"] + room1["height"], room2["y"] + room2["height"])
                
                if y_max > y_min:  # If there's overlap
                    # Choose a point in the middle of the overlap
                    door_y = y_min + (y_max - y_min) // 2
                    
                    # Verify this point is on the boundary between the two rooms
                    if (grid_with_doors[door_y, room1["x"] + room1["width"] - 1] == room1_id + 1 and
                        grid_with_doors[door_y, room2["x"]] == room2_id + 1):
                        doorway_candidates.append((room2["x"], door_y))  # Place door at Room 2's entrance
            
            # Room 1 to the right of Room 2
            elif room2["x"] + room2["width"] == room1["x"]:
                # Find overlapping y-range
                y_min = max(room1["y"], room2["y"])
                y_max = min(room1["y"] + room1["height"], room2["y"] + room2["height"])
                
                if y_max > y_min:  # If there's overlap
                    # Choose a point in the middle of the overlap
                    door_y = y_min + (y_max - y_min) // 2
                    
                    # Verify this point is on the boundary between the two rooms
                    if (grid_with_doors[door_y, room1["x"]] == room1_id + 1 and
                        grid_with_doors[door_y, room2["x"] + room2["width"] - 1] == room2_id + 1):
                        doorway_candidates.append((room1["x"], door_y))  # Place door at Room 1's entrance
            
            # Room 1 above Room 2
            elif room1["y"] + room1["height"] == room2["y"]:
                # Find overlapping x-range
                x_min = max(room1["x"], room2["x"])
                x_max = min(room1["x"] + room1["width"], room2["x"] + room2["width"])
                
                if x_max > x_min:  # If there's overlap
                    # Choose a point in the middle of the overlap
                    door_x = x_min + (x_max - x_min) // 2
                    
                    # Verify this point is on the boundary between the two rooms
                    if (grid_with_doors[room1["y"] + room1["height"] - 1, door_x] == room1_id + 1 and
                        grid_with_doors[room2["y"], door_x] == room2_id + 1):
                        doorway_candidates.append((door_x, room2["y"]))  # Place door at Room 2's entrance
            
            # Room 1 below Room 2
            elif room2["y"] + room2["height"] == room1["y"]:
                # Find overlapping x-range
                x_min = max(room1["x"], room2["x"])
                x_max = min(room1["x"] + room1["width"], room2["x"] + room2["width"])
                
                if x_max > x_min:  # If there's overlap
                    # Choose a point in the middle of the overlap
                    door_x = x_min + (x_max - x_min) // 2
                    
                    # Verify this point is on the boundary between the two rooms
                    if (grid_with_doors[room1["y"], door_x] == room1_id + 1 and
                        grid_with_doors[room2["y"] + room2["height"] - 1, door_x] == room2_id + 1):
                        doorway_candidates.append((door_x, room1["y"]))  # Place door at Room 1's entrance
            
            # If rooms are adjacent, place a doorway
            if doorway_candidates:
                # Choose the first candidate
                door_x, door_y = doorway_candidates[0]
                
                # Limit number of doors per room (except for hallways)
                if (room1["type"] == "hallway" or room2["type"] == "hallway" or
                    room_has_doorway[room1_id] < 3 and room_has_doorway[room2_id] < 3):
                    
                    # Mark doorway on grid
                    grid_with_doors[door_y, door_x] = doorway_value
                    
                    # Increment door counter for these rooms
                    room_has_doorway[room1_id] += 1
                    room_has_doorway[room2_id] += 1
        
        return grid_with_doors
    
    def visualize_layout(self, layout_result: Dict[str, Any], save_path: Optional[str] = None, show_labels: bool = True) -> plt.Figure:
        grid = np.array(layout_result["grid"])
        room_positions = layout_result["room_positions"]

        fig, ax = plt.subplots(figsize=(12, 10))
        ax.set_facecolor('#F5F5F5')

        # Dibujar habitaciones
        for room_id, room_info in room_positions.items():
            x, y = room_info["x"], room_info["y"]
            width, height = room_info["width"], room_info["height"]
            color = room_info["color"]

            rect = plt.Rectangle((x, y), width, height, facecolor=color, edgecolor='black', linewidth=1.5)
            ax.add_patch(rect)

            # Dibujar labels
            if show_labels:
                ax.text(x + width/2, y + height/2, room_info["name"].upper(), 
                        ha='center', va='center', fontsize=7, fontweight='bold', color='black')

        # Dibujar puertas
        height, width = grid.shape
        for y in range(height):
            for x in range(width):
                if grid[y, x] == -1:  # Puerta
                    left = grid[y, x-1] if x > 0 else 0
                    right = grid[y, x+1] if x < width -1 else 0
                    up = grid[y-1, x] if y > 0 else 0
                    down = grid[y+1, x] if y < height -1 else 0

                    if left > 0 and right > 0 and left != right:
                        door_rect = plt.Rectangle((x - 0.05, y - 0.5), 0.1, 1.0, facecolor='white', edgecolor='black', linewidth=0.8)
                        ax.add_patch(door_rect)
                    elif up > 0 and down > 0 and up != down:
                        door_rect = plt.Rectangle((x - 0.5, y - 0.05), 1.0, 0.1, facecolor='white', edgecolor='black', linewidth=0.8)
                        ax.add_patch(door_rect)

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
        Generate a JSON representation of the layout for use with the rendering module.
        
        Args:
            layout_result: The layout generated by generate_layout()
            
        Returns:
            JSON string representation
        """
        import json
        
        # Convert numpy arrays to lists
        serializable_result = {
            "grid": layout_result["grid"].tolist() if isinstance(layout_result["grid"], np.ndarray) 
                    else layout_result["grid"],
            "room_positions": layout_result["room_positions"],
            "grid_size": layout_result["grid_size"],
            "cell_size": layout_result["cell_size"],
            "rooms": layout_result["rooms"]
        }
        
        return json.dumps(serializable_result, indent=2)
    
    def generate_svg_representation(self, layout_result: Dict[str, Any]) -> str:
        """
        Generate an SVG representation of the floor plan.
        
        Args:
            layout_result: The layout generated by generate_layout()
            
        Returns:
            SVG string representation
        """
        grid = np.array(layout_result["grid"]) if not isinstance(layout_result["grid"], np.ndarray) else layout_result["grid"]
        room_positions = layout_result["room_positions"]
        
        # SVG parameters
        cell_size = 30  # pixels per cell
        height, width = grid.shape
        svg_width = width * cell_size
        svg_height = height * cell_size
        
        # Start SVG
        svg = [f'<svg width="{svg_width}" height="{svg_height}" viewBox="0 0 {svg_width} {svg_height}" xmlns="http://www.w3.org/2000/svg">']
        
        # Background
        svg.append(f'<rect width="{svg_width}" height="{svg_height}" fill="#F5F5F5" />')
        
        # Draw rooms
        for room_id, room_info in room_positions.items():
            x, y = room_info["x"], room_info["y"]
            room_width, room_height = room_info["width"], room_info["height"]
            color = room_info["color"]
            
            # Convert to SVG coordinates
            svg_x = x * cell_size
            svg_y = y * cell_size
            svg_width = room_width * cell_size
            svg_height = room_height * cell_size
            
            # Add room rectangle
            svg.append(f'<rect x="{svg_x}" y="{svg_y}" width="{svg_width}" height="{svg_height}" '
                    f'fill="{color}" stroke="black" stroke-width="2" />')
            
            # Add room label
            text_x = svg_x + svg_width / 2
            text_y = svg_y + svg_height / 2
            svg.append(f'<text x="{text_x}" y="{text_y}" font-family="Arial" font-size="12" '
                    f'font-weight="bold" text-anchor="middle" dominant-baseline="middle">'
                    f'{room_info["name"]}</text>')
        
        # Draw doorways - adjust the size to better represent doors
        door_size = cell_size * 0.8  # Slightly larger door symbol
        for y in range(height):
            for x in range(width):
                if grid[y, x] == -1:  # Doorway
                    door_x = x * cell_size - door_size / 2 + cell_size / 2
                    door_y = y * cell_size - door_size / 2 + cell_size / 2
                    
                    svg.append(f'<rect x="{door_x}" y="{door_y}" width="{door_size}" height="{door_size}" '
                            f'fill="white" stroke="black" stroke-width="1.5" />')
        
        # Add grid lines (optional - comment out if you don't want grid lines)
        for i in range(width + 1):
            x = i * cell_size
            svg.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{height * cell_size}" '
                    f'stroke="gray" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.3" />')
        
        for i in range(height + 1):
            y = i * cell_size
            svg.append(f'<line x1="0" y1="{y}" x2="{width * cell_size}" y2="{y}" '
                    f'stroke="gray" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.3" />')
        
        # Close SVG
        svg.append('</svg>')
        
        return '\n'.join(svg)