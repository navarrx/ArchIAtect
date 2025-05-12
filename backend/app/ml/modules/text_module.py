import re
import spacy
from typing import Dict, List, Optional, Tuple, Any
import json

# Load spaCy model for NLP tasks
try:
    nlp = spacy.load("en_core_web_sm")
except:
    print("Installing spaCy model...")
    import os
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

class TextUnderstandingModule:
    def __init__(self):
        # Common room types to look for in prompts
        self.room_types = [
            "bedroom", "bathroom", "kitchen", "living room", "dining room", 
            "garage", "laundry room", "entryway"
        ]
        
        # Size descriptors and their approximate square footage
        self.size_descriptors = {
            "small": 0.7,  # 70% of standard size
            "medium": 1.0,  # standard size
            "large": 1.3,   # 130% of standard size
        }
        
        # Default square footage for common room types
        self.default_room_sizes = {
            "bedroom": 120,      # sq ft
            "bathroom": 50,
            "kitchen": 100,
            "living room": 200,
            "dining room": 120,
            "garage": 240,
            "laundry room": 50,
            "entryway": 20
        }
        
        # Adjacency keywords
        self.adjacency_keywords = [
            "next to", "adjacent to", "beside", "connected to", 
            "near", "close to", "adjoining", "off of", "opens to"
        ]
    
    def parse_prompt(self, prompt: str) -> Dict[str, Any]:
        """
        Parse a natural language prompt into structured floor plan requirements.
        
        Args:
            prompt: Natural language description of floor plan requirements
            
        Returns:
            Dictionary containing parsed requirements
        """
        # Process with spaCy
        doc = nlp(prompt.lower())
        
        # Extract basic info
        result = {
            "rooms": self._extract_rooms(doc),
            "adjacency": self._extract_adjacency(doc),
            "style": self._extract_style(doc),
            "constraints": self._extract_constraints(doc),
            "original_prompt": prompt
        }
        
        # Validate and fill in missing information
        result = self._validate_and_complete(result)
        
        return result
    
    def _extract_rooms(self, doc) -> List[Dict[str, Any]]:
        """Extract room information including counts and sizes."""
        rooms = []
        room_counts = {}
        
        # First pass: Find explicit room counts
        for token in doc:
            if token.like_num and token.head.text in self.room_types:
                room_type = token.head.text
                count = int(token.text) if token.text.isdigit() else self._text_to_number(token.text)
                room_counts[room_type] = count
            
            # Handle phrases like "two bedrooms"
            if token.like_num and token.i < len(doc) - 1:
                next_token = doc[token.i + 1]
                if next_token.text in self.room_types:
                    count = int(token.text) if token.text.isdigit() else self._text_to_number(token.text)
                    room_counts[next_token.text] = count
        
        # Second pass: Find room mentions with size descriptors
        for room_type in self.room_types:
            if room_type in doc.text:
                # If we didn't find an explicit count, default to 1
                count = room_counts.get(room_type, 1)
                
                # Look for size descriptors
                size_factor = 1.0
                size_text = "medium"
                
                for size, factor in self.size_descriptors.items():
                    pattern = f"{size} {room_type}"
                    if pattern in doc.text:
                        size_factor = factor
                        size_text = size
                        break
                
                # Calculate approximate square footage
                base_size = self.default_room_sizes.get(room_type, 100)
                square_footage = base_size * size_factor
                
                # Add to our rooms list
                rooms.append({
                    "type": room_type,
                    "count": count,
                    "size_descriptor": size_text,
                    "approximate_sqft": square_footage
                })
        
        return rooms
    
    def _extract_adjacency(self, doc) -> List[Dict[str, str]]:
        """Extract adjacency relationships between rooms."""
        adjacencies = []
        
        # Look for adjacency phrases
        text = doc.text
        for keyword in self.adjacency_keywords:
            if keyword in text:
                # Find the sentence containing this keyword
                for sent in doc.sents:
                    if keyword in sent.text:
                        # Simple pattern matching for now
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
        """Extract style preferences from the prompt."""
        style = {"primary_style": "modern"}  # Default style
        
        # Common architectural styles
        styles = ["modern", "traditional", "minimalist"]
        
        # Check for style mentions
        for style_name in styles:
            if style_name in doc.text:
                style["primary_style"] = style_name
                break
        
        return style
    
    def _extract_constraints(self, doc) -> List[str]:
        """Extract any special constraints or requirements."""
        constraints = []
        
        # Look for common constraint phrases
        constraint_phrases = [
            "must have", "should have", "needs to have", "required",
            "important", "necessary", "essential"
        ]
        
        for phrase in constraint_phrases:
            if phrase in doc.text:
                # Find the sentence containing this phrase
                for sent in doc.sents:
                    if phrase in sent.text:
                        constraints.append(sent.text)
        
        return constraints
    
    def _validate_and_complete(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate parsed data and fill in missing information."""
        # Make sure we have at least one room
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
        
        # Add total stats
        total_rooms = sum(room["count"] for room in parsed_data["rooms"])
        total_sqft = sum(room["count"] * room["approximate_sqft"] for room in parsed_data["rooms"])
        
        parsed_data["stats"] = {
            "total_rooms": total_rooms,
            "total_approximate_sqft": total_sqft
        }
        
        return parsed_data
    
    def _find_closest_room_mention(self, text_snippet: str) -> Optional[str]:
        """Find the room type mentioned closest to the end of the text snippet."""
        for room_type in self.room_types:
            if room_type in text_snippet:
                return room_type
        return None
    
    def _text_to_number(self, text: str) -> int:
        """Convert text number words to integers."""
        word_to_num = {
            "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
            "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10
        }
        return word_to_num.get(text.lower(), 1)
    
    def generate_report(self, parsed_data: Dict[str, Any]) -> str:
        """Generate a human-readable report of the parsed requirements."""
        report = ["Floor Plan Requirements:"]
        report.append("-" * 50)
        
        # Add room information
        report.append("Rooms:")
        for room in parsed_data["rooms"]:
            report.append(f"  - {room['count']} {room['size_descriptor']} {room['type']} "
                         f"(~{room['approximate_sqft']} sq ft each)")
        
        # Add adjacency information
        if parsed_data["adjacency"]:
            report.append("\nRoom Relationships:")
            for adj in parsed_data["adjacency"]:
                report.append(f"  - {adj['room1']} should be {adj['relationship']} {adj['room2']}")
        
        # Add style information
        report.append(f"\nStyle: {parsed_data['style']['primary_style']}")
        
        # Add constraints
        if parsed_data["constraints"]:
            report.append("\nSpecial Requirements:")
            for constraint in parsed_data["constraints"]:
                report.append(f"  - {constraint}")
        
        # Add stats
        report.append("\nSummary Statistics:")
        report.append(f"  - Total rooms: {parsed_data['stats']['total_rooms']}")
        report.append(f"  - Approximate total area: {parsed_data['stats']['total_approximate_sqft']} sq ft")
        
        return "\n".join(report)