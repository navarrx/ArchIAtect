import torch
import numpy as np
from PIL import Image
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler
from diffusers.utils import load_image
from typing import Optional


class StableDiffusionControlNetModule:
    def __init__(self, 
                 sd_model_path: str = "runwayml/stable-diffusion-v1-5",
                 controlnet_model_path: str = "lllyasviel/sd-controlnet-scribble",
                 lora_path: Optional[str] = None,  # ✅ Ahora acepta lora_path
                 device: str = "cuda" if torch.cuda.is_available() else "cpu"):
        """
        Initialize the Stable Diffusion + ControlNet (+ LoRA) module.
        """
        self.device = device

        # Load ControlNet model
        controlnet = ControlNetModel.from_pretrained(controlnet_model_path, torch_dtype=torch.float16).to(self.device)

        # Load pipeline
        self.pipeline = StableDiffusionControlNetPipeline.from_pretrained(
            sd_model_path,
            controlnet=controlnet,
            torch_dtype=torch.float16,
            safety_checker=None
        ).to(self.device)

        # Use a faster scheduler
        self.pipeline.scheduler = UniPCMultistepScheduler.from_config(self.pipeline.scheduler.config)

        # ✅ Load LoRA weights if provided
        if lora_path:
            print(f"Loading LoRA weights from {lora_path}")
            self.pipeline.load_lora_weights(lora_path)
            self.pipeline.fuse_lora()
            print("LoRA loaded and fused successfully.")

    def generate_from_layout(self, 
                             layout_image: Image.Image,
                             prompt: str = "A black and white architectural floor plan, technical 2D blueprint drawing, no furniture, no textures, no colors, just walls and room labels, clean lines, top-down view.",
                             negative_prompt: str = "blurry, distorted, messy, bad proportions",
                             num_inference_steps: int = 50,
                             guidance_scale: float = 5.0,
                             controlnet_conditioning_scale: float = 1.0,
                             width: int = 768,
                             height: int = 768,
                             output_path: str = "output/images/generated_floorplan.png") -> Image.Image:
        """
        Generate a refined floor plan following the layout structure.
        """

        # Resize layout image to match SD input size
        layout_image = layout_image.resize((width, height))

        # Convert to RGB (ControlNet expects 3 channels)
        layout_image = layout_image.convert("RGB")

        # Run pipeline
        with torch.autocast(device_type=self.device, dtype=torch.float16):
            output = self.pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=layout_image,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                controlnet_conditioning_scale=controlnet_conditioning_scale,
                width=width,
                height=height
            )

        image = output.images[0]
        image.save(output_path)
        print(f"Saved generated floor plan to {output_path}")

        return image