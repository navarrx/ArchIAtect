import re
import spacy
from typing import Dict, List, Optional, Tuple, Any
import json

# Cargar modelo spaCy para NLP
try:
    nlp = spacy.load("en_core_web_sm")
except:
    print("Instalando modelo de spaCy...")
    import os
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

class TextUnderstandingModule:
    def __init__(self):
        # Tipos de habitaciones comunes a buscar en los prompts
        self.room_types = [
            "bedroom", "bathroom", "kitchen", "living room", "dining room", 
            "garage", "laundry room", "entryway"
        ]
        
        # Descriptores de tamaño y sus pies cuadrados aproximados
        self.size_descriptors = {
            "small": 0.7,  # 70% del tamaño estándar
            "medium": 1.0,  # tamaño estándar
            "large": 1.3,   # 130% del tamaño estándar
        }
        
        # Pies cuadrados predeterminados para tipos de habitaciones comunes
        self.default_room_sizes = {
            "bedroom": 120,      
            "bathroom": 50,
            "kitchen": 100,
            "living room": 200,
            "dining room": 120,
            "garage": 240,
            "laundry room": 50,
            "entryway": 20
        }
        
        # Palabras clave para el grafo   de adyacencia
        self.adjacency_keywords = [
            "next to", "adjacent to", "beside", "connected to", 
            "near", "close to", "adjoining", "off of", "opens to"
        ]
    
    def parse_prompt(self, prompt: str) -> Dict[str, Any]:
        """
        Analiza un prompt en lenguaje natural y lo convierte en requerimientos estructurados para el plano.
        
        Args:
            prompt: Descripción en lenguaje natural de los requerimientos del plano
            
        Returns:
            Diccionario conteniendo los requerimientos analizados
        """
        # Procesar con spaCy
        doc = nlp(prompt.lower())
        
        # Extraer información básica
        result = {
            "rooms": self._extract_rooms(doc),
            "adjacency": self._extract_adjacency(doc),
            "style": self._extract_style(doc),
            "constraints": self._extract_constraints(doc),
            "original_prompt": prompt
        }
        
        # Validar y completar información faltante
        result = self._validate_and_complete(result)
        
        return result
    
    def _extract_rooms(self, doc) -> List[Dict[str, Any]]:
        """Extrae información de habitaciones incluyendo cantidades y tamaños."""
        rooms = []
        room_counts = {}
        
        # Primer paso: Encontrar cantidades explícitas de habitaciones
        for token in doc:
            if token.like_num and token.head.text in self.room_types:
                room_type = token.head.text
                count = int(token.text) if token.text.isdigit() else self._text_to_number(token.text)
                room_counts[room_type] = count
            
            # Manejar frases como "dos dormitorios"
            if token.like_num and token.i < len(doc) - 1:
                next_token = doc[token.i + 1]
                if next_token.text in self.room_types:
                    count = int(token.text) if token.text.isdigit() else self._text_to_number(token.text)
                    room_counts[next_token.text] = count
        
        # Segundo paso: Encontrar menciones de habitaciones con descriptores de tamaño
        for room_type in self.room_types:
            if room_type in doc.text:
                # Si no encontramos una cantidad explícita, usar 1 por defecto
                count = room_counts.get(room_type, 1)
                
                # Buscar descriptores de tamaño
                size_factor = 1.0
                size_text = "medium"
                
                for size, factor in self.size_descriptors.items():
                    pattern = f"{size} {room_type}"
                    if pattern in doc.text:
                        size_factor = factor
                        size_text = size
                        break
                
                # Calcular pies cuadrados aproximados
                base_size = self.default_room_sizes.get(room_type, 100)
                square_footage = base_size * size_factor
                
                # Agregar a nuestra lista de habitaciones
                rooms.append({
                    "type": room_type,
                    "count": count,
                    "size_descriptor": size_text,
                    "approximate_sqft": square_footage
                })
        
        return rooms
    
    def _extract_adjacency(self, doc) -> List[Dict[str, str]]:
        """Extrae relaciones de adyacencia entre habitaciones."""
        adjacencies = []
        
        # Buscar frases de adyacencia
        text = doc.text
        for keyword in self.adjacency_keywords:
            if keyword in text:
                # Encontrar la oración que contiene esta palabra clave
                for sent in doc.sents:
                    if keyword in sent.text:
                        # Coincidencia de patrones simple por ahora
                        parts = sent.text.split(keyword)
                        if len(parts) == 2:
                            room1 = self._find_closest_room_mention(parts[0])
                            room2 = self._find_closest_room_mention(parts[1])
                            
                            if room1 and room2:
                                adjacencies.append({
                                    "room1": room1,
                                    "room2": room2,
                                    "relationship": keyword
                                })
        
        return adjacencies
    
    def _extract_style(self, doc) -> Dict[str, Any]:
        """Extrae preferencias de estilo del prompt."""
        style = {"primary_style": "modern"}  # Estilo por defecto
        
        # Estilos arquitectónicos comunes
        styles = ["modern", "traditional", "minimalist"]
        
        # Verificar menciones de estilo
        for style_name in styles:
            if style_name in doc.text:
                style["primary_style"] = style_name
                break
        
        return style
    
    def _extract_constraints(self, doc) -> List[str]:
        """Extrae restricciones o requerimientos especiales."""
        constraints = []
        
        # Buscar frases de restricción comunes
        constraint_phrases = [
            "must have", "should have", "needs to have", "required",
            "important", "necessary", "essential"
        ]
        
        for phrase in constraint_phrases:
            if phrase in doc.text:
                # Encontrar la oración que contiene esta frase
                for sent in doc.sents:
                    if phrase in sent.text:
                        constraints.append(sent.text)
        
        return constraints
    
    def _validate_and_complete(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Valida los datos analizados y completa información faltante."""
        # Asegurarse de que tengamos al menos una habitación
        if not parsed_data["rooms"]:
            parsed_data["rooms"] = [
                {"type": "bedroom", "count": 2, "size_descriptor": "medium", 
                 "approximate_sqft": self.default_room_sizes["bedroom"]},
                {"type": "bathroom", "count": 1, "size_descriptor": "medium", 
                 "approximate_sqft": self.default_room_sizes["bathroom"]},
                {"type": "kitchen", "count": 1, "size_descriptor": "medium", 
                 "approximate_sqft": self.default_room_sizes["kitchen"]},
                {"type": "living room", "count": 1, "size_descriptor": "medium", 
                 "approximate_sqft": self.default_room_sizes["living room"]}
            ]
        
        # Agregar estadísticas totales
        total_rooms = sum(room["count"] for room in parsed_data["rooms"])
        total_sqft = sum(room["count"] * room["approximate_sqft"] for room in parsed_data["rooms"])
        
        parsed_data["stats"] = {
            "total_rooms": total_rooms,
            "total_approximate_sqft": total_sqft
        }
        
        return parsed_data
    
    def _find_closest_room_mention(self, text_snippet: str) -> Optional[str]:
        """Encuentra el tipo de habitación mencionado más cerca del final del fragmento de texto."""
        for room_type in self.room_types:
            if room_type in text_snippet:
                return room_type
        return None
    
    def _text_to_number(self, text: str) -> int:
        """Convierte palabras numéricas a enteros."""
        word_to_num = {
            "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
            "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10
        }
        return word_to_num.get(text.lower(), 1)
    
    def generate_report(self, parsed_data: Dict[str, Any]) -> str:
        """Genera un reporte legible de los requerimientos analizados."""
        report = ["Requerimientos del Plano:"]
        report.append("-" * 50)
        
        # Agregar información de habitaciones
        report.append("Habitaciones:")
        for room in parsed_data["rooms"]:
            report.append(f"  - {room['count']} {room['size_descriptor']} {room['type']} "
                         f"(~{room['approximate_sqft']} pies cuadrados cada una)")
        
        # Agregar información de adyacencia
        if parsed_data["adjacency"]:
            report.append("\nRelaciones entre Habitaciones:")
            for adj in parsed_data["adjacency"]:
                report.append(f"  - {adj['room1']} debe estar {adj['relationship']} {adj['room2']}")
        
        # Agregar información de estilo
        report.append(f"\nEstilo: {parsed_data['style']['primary_style']}")
        
        # Agregar restricciones
        if parsed_data["constraints"]:
            report.append("\nRequerimientos Especiales:")
            for constraint in parsed_data["constraints"]:
                report.append(f"  - {constraint}")
        
        # Agregar estadísticas
        report.append("\nEstadísticas Resumen:")
        report.append(f"  - Total de habitaciones: {parsed_data['stats']['total_rooms']}")
        report.append(f"  - Área total aproximada: {parsed_data['stats']['total_approximate_sqft']} pies cuadrados")
        
        return "\n".join(report)