import os
import json
import matplotlib.pyplot as plt
from typing import Dict, Any, Optional, Union
from PIL import Image, ImageDraw, ImageFont

# Import our modules
from ..modules.text_module import TextUnderstandingModule
from ..modules.layout_module import LayoutGenerationModule
from ..modules.sd_controlnet_module import StableDiffusionControlNetModule  # ✅ Usamos tu módulo corregido


class FloorPlanGenerator:
    def __init__(self, use_stable_diffusion: bool = True):
        """
        Initialize the floor plan generator pipeline.
        """
        self.text_module = TextUnderstandingModule()
        self.layout_module = LayoutGenerationModule()

        self.use_stable_diffusion = use_stable_diffusion
        if self.use_stable_diffusion:
            try:
                # Obtener la ruta del directorio actual del pipeline
                current_dir = os.path.dirname(os.path.abspath(__file__))
                lora_path = os.path.join(current_dir, "..", "lora", "floorplan_lora_weights.safetensors")
                
                self.sd_module = StableDiffusionControlNetModule(
                    lora_path=lora_path
                )
                print("✅ Stable Diffusion + ControlNet + LoRA module initialized successfully.")
            except Exception as e:
                print(f"Could not initialize Stable Diffusion ControlNet module: {e}")
                print("Falling back to layout-only mode.")
                self.use_stable_diffusion = False

        self.current_requirements = None
        self.current_layout = None
        self.current_controlnet_input_image = None
        self.current_labeled_layout_image = None
        self.current_sd_image = None

        os.makedirs("output", exist_ok=True)
        os.makedirs("output/images", exist_ok=True)

    def generate_from_prompt(self, prompt: str, 
                              output_path: Optional[str] = "output",
                              generate_sd_image: Optional[bool] = None) -> Dict[str, Any]:
        print(f"Analyzing prompt: '{prompt}'")

        self.current_requirements = self.text_module.parse_prompt(prompt)
        report = self.text_module.generate_report(self.current_requirements)
        print("\nRequirements Report:")
        print(report)

        print("\nGenerating layout...")
        self.current_layout = self.layout_module.generate_layout(self.current_requirements)

        # ✅ Genera imagen limpia (binaria) para ControlNet
        self.current_controlnet_input_image = self._save_controlnet_input_image("output/images/layout_for_controlnet.png")

        # ✅ Genera imagen con labels para usuario
        self.current_labeled_layout_image = self._save_labeled_layout_image("output/images/layout_with_labels.png")

        use_sd = self.use_stable_diffusion
        if generate_sd_image is not None:
            use_sd = generate_sd_image

        if use_sd:
            print("\nGenerating ControlNet + LoRA floor plan...")
            self.generate_sd_image()

        output_files = {}
        if output_path:
            base_filename = "_".join(prompt.split()[:5]).lower()
            base_filename = ''.join(c if c.isalnum() or c == '_' else '_' for c in base_filename)

            req_path = os.path.join(output_path, f"{base_filename}_requirements.json")
            with open(req_path, 'w') as f:
                json.dump(self.current_requirements, f, indent=2)
            output_files["requirements_json"] = req_path

            layout_path = os.path.join(output_path, f"{base_filename}_layout.json")
            with open(layout_path, 'w') as f:
                f.write(self.layout_module.generate_layout_json(self.current_layout))
            output_files["layout_json"] = layout_path

            # ✅ Guarda imagen CON labels
            vis_path = os.path.join(output_path, "images", f"{base_filename}_floorplan_with_labels.png")
            self.current_labeled_layout_image.save(vis_path)
            output_files["visualization"] = vis_path

            # ✅ Guarda imagen SIN puertas ni labels (para SD)
            controlnet_vis_path = os.path.join(output_path, "images", f"{base_filename}_floorplan_for_controlnet.png")
            self.current_controlnet_input_image.save(controlnet_vis_path)
            output_files["controlnet_input_image"] = controlnet_vis_path

            if self.current_sd_image:
                sd_path = os.path.join(output_path, "images", f"{base_filename}_sd_floorplan.png")
                self.current_sd_image.save(sd_path)
                output_files["sd_image"] = sd_path

            print(f"\nOutputs saved to {output_path}:")
            for key, path in output_files.items():
                print(f"- {key}: {path}")

        return {
            "requirements": self.current_requirements,
            "layout": self.current_layout,
            "report": report,
            "output_files": output_files
        }

    def _save_controlnet_input_image(self, save_path: str) -> Image.Image:
        """
        ✅ Guarda la imagen limpia (blanco/negro) sin puertas ni texto para ControlNet.
        """
        if self.current_layout is None:
            raise ValueError("No layout has been generated yet")

        self.layout_module.generate_controlnet_input(self.current_layout, save_path=save_path)
        layout_img = Image.open(save_path).convert("L")  # Convert to grayscale
        return layout_img

    def _save_labeled_layout_image(self, save_path: str) -> Image.Image:
        """
        ✅ Guarda la imagen CON labels, colores y puertas para mostrar al usuario.
        """
        if self.current_layout is None:
            raise ValueError("No layout has been generated yet")

        self.layout_module.visualize_layout(self.current_layout, save_path=save_path, show_labels=True)
        layout_img = Image.open(save_path)
        return layout_img

    def generate_layout_image(self) -> plt.Figure:
        if self.current_layout is None:
            raise ValueError("No layout has been generated yet")

        return self.layout_module.visualize_layout(self.current_layout)

    def generate_sd_image(self, 
                          custom_prompt: Optional[str] = None, 
                          width: int = 768, 
                          height: int = 768) -> Image.Image:
        if not self.use_stable_diffusion:
            raise ValueError("Stable Diffusion is not enabled")

        if self.current_controlnet_input_image is None:
            raise ValueError("Layout image not prepared for ControlNet")

        prompt = custom_prompt or (
            "2D architectural floor plan, black and white blueprint, clean lines, accurate room proportions, doors clearly marked, no furniture, no textures, no tiles, no duplicate rooms, top-down view, technical drawing, CAD style, precise, minimal, draw all doors"
        )

        image = self.sd_module.generate_from_layout(
            layout_image=self.current_controlnet_input_image,
            prompt=prompt,
            negative_prompt="blurry, distorted, messy, bad proportions, duplicate rooms, duplicate labels, colorful, textured floor, 3D, perspective view, shadows, rendered, photorealistic, grass, tiles, carpet, wood floor, wrong room placement, wrong layout",
            num_inference_steps=40,
            guidance_scale=9.5,
            controlnet_conditioning_scale=1.8,
            width=width,
            height=height
        )

        self.current_sd_image = image
        return image