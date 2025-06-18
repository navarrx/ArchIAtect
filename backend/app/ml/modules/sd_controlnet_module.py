import torch
import numpy as np
from PIL import Image
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler
from diffusers.utils import load_image
from typing import Optional, List
import os

class StableDiffusionControlNetModule:
    def __init__(self, 
                 sd_model_path: str = "runwayml/stable-diffusion-v1-5",
                 controlnet_model_path: str = "lllyasviel/sd-controlnet-scribble",
                 lora_path: Optional[str] = None,
                 device: str = "cuda" if torch.cuda.is_available() else "cpu"):
        """
        Inicializa el módulo de Stable Diffusion + ControlNet (+ LoRA).
        """
        self.device = device
        self.dtype = torch.float16 if device == "cuda" else "cpu"
        
        # Cargar modelo ControlNet
        controlnet = ControlNetModel.from_pretrained(
            controlnet_model_path,
            torch_dtype=self.dtype
        ).to(self.device)
        
        # Cargar pipeline
        self.pipeline = StableDiffusionControlNetPipeline.from_pretrained(
            sd_model_path,
            controlnet=controlnet,
            torch_dtype=self.dtype,
            safety_checker=None
        ).to(self.device)
        
        # Usar un scheduler más rápido
        self.pipeline.scheduler = UniPCMultistepScheduler.from_config(self.pipeline.scheduler.config)
        
        # Cargar pesos LoRA si se proporcionan
        if lora_path:
            print(f"Cargando pesos LoRA desde {lora_path}")
            try:
                lora_path = os.path.abspath(lora_path)
                print(f"Ruta absoluta a los pesos LoRA: {lora_path}")
                
                self.pipeline.load_lora_weights(lora_path)
                self.pipeline.fuse_lora()
                print("LoRA cargado y fusionado exitosamente.")
            except Exception as e:
                print(f"Advertencia: No se pudieron cargar los pesos LoRA: {e}")
                print("Continuando sin pesos LoRA.")

    def generate_from_layout(self, 
                             layout_image: Image.Image,
                             prompt: str = "A black and white architectural floor plan with clearly defined walls, MUST HAVE doors on every room, and MUST HAVE windows facing outside the house, top-down view, technical 2D blueprint drawing, clean lines, precise layout, no furniture, no textures, no colors",
                             negative_prompt: str = "blurry, distorted, messy, bad proportions, missing doors, missing windows, furniture, textures, colors",
                             num_inference_steps: int = 50,
                             guidance_scale: float = 6.0,
                             controlnet_conditioning_scale: float = 1.0,
                             width: int = 768,
                             height: int = 768,
                             output_path: str = "output/images/generated_floorplan.png",
                             strategy: str = "balanced") -> Image.Image:
        """
        Genera un plano refinado siguiendo la estructura del layout.
        
        Estrategias disponibles:
        - "strict": Adherencia estricta al layout (guess_mode=False, high conditioning)
        - "balanced": Balance entre layout y detalles (guess_mode=False, medium conditioning)
        - "creative": Más libertad creativa (guess_mode=True, lower conditioning)
        - "multi_pass": Generación en múltiples pasadas
        """
        
        # Redimensionar imagen del layout
        layout_image = layout_image.resize((width, height))
        layout_image = layout_image.convert("RGB")
        
        if strategy == "multi_pass":
            return self._generate_multi_pass(layout_image, prompt, negative_prompt, 
                                           num_inference_steps, guidance_scale, 
                                           width, height, output_path)
        
        # Configurar parámetros según estrategia
        strategy_configs = {
            "strict": {
                "guess_mode": False,
                "controlnet_conditioning_scale": 1.2,
                "guidance_scale": guidance_scale * 1.2
            },
            "balanced": {
                "guess_mode": False,
                "controlnet_conditioning_scale": controlnet_conditioning_scale,
                "guidance_scale": guidance_scale
            },
            "creative": {
                "guess_mode": True,
                "controlnet_conditioning_scale": controlnet_conditioning_scale * 0.8,
                "guidance_scale": guidance_scale * 0.9
            }
        }
        
        config = strategy_configs.get(strategy, strategy_configs["balanced"])
        
        with torch.autocast(device_type=self.device, dtype=self.dtype):
            output = self.pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=layout_image,
                num_inference_steps=num_inference_steps,
                guidance_scale=config["guidance_scale"],
                controlnet_conditioning_scale=config["controlnet_conditioning_scale"],
                width=width,
                height=height,
                guess_mode=config["guess_mode"]
            )
        
        image = output.images[0]
        image.save(output_path)
        print(f"Plano generado (estrategia: {strategy}) guardado en {output_path}")
        return image

    def _generate_multi_pass(self, layout_image, prompt, negative_prompt, 
                           num_inference_steps, guidance_scale, width, height, output_path):
        """
        Generación en múltiples pasadas: primero estructura, luego detalles.
        """
        print("Iniciando generación multi-pass...")
        
        # Primera pasada: Adherencia estricta al layout
        print("Pasada 1: Generando estructura base...")
        structure_prompt = "A clean architectural floor plan with precise walls and room divisions, top-down view, technical 2D blueprint drawing, black lines on white background"
        structure_negative = "blurry, distorted, messy, bad proportions, furniture, textures, colors, decorations"
        
        with torch.autocast(device_type=self.device, dtype=self.dtype):
            structure_output = self.pipeline(
                prompt=structure_prompt,
                negative_prompt=structure_negative,
                image=layout_image,
                num_inference_steps=num_inference_steps // 2,
                guidance_scale=guidance_scale * 1.3,
                controlnet_conditioning_scale=1.3,
                width=width,
                height=height,
                guess_mode=False
            )
        
        structure_image = structure_output.images[0]
        
        # Segunda pasada: Agregar detalles usando la estructura generada
        print("Pasada 2: Agregando puertas y ventanas...")
        detail_prompt = prompt  # Usar el prompt original con detalles
        
        with torch.autocast(device_type=self.device, dtype=self.dtype):
            final_output = self.pipeline(
                prompt=detail_prompt,
                negative_prompt=negative_prompt,
                image=structure_image,  # Usar la estructura generada como guía
                num_inference_steps=num_inference_steps // 2,
                guidance_scale=guidance_scale,
                controlnet_conditioning_scale=0.8,  # Menor adherencia para permitir detalles
                width=width,
                height=height,
                guess_mode=True  # Permitir más creatividad en detalles
            )
        
        final_image = final_output.images[0]
        final_image.save(output_path)
        print(f"Plano multi-pass generado guardado en {output_path}")
        return final_image

    def generate_with_adaptive_conditioning(self, 
                                          layout_image: Image.Image,
                                          prompt: str,
                                          negative_prompt: str = "",
                                          num_inference_steps: int = 50,
                                          guidance_scale: float = 6.0,
                                          width: int = 768,
                                          height: int = 768,
                                          output_path: str = "output/images/generated_floorplan.png") -> Image.Image:
        """
        Generación con conditioning adaptativo que cambia durante el proceso.
        """
        layout_image = layout_image.resize((width, height)).convert("RGB")
        
        # Definir scheduling de conditioning - más fuerte al inicio, más suave al final
        def conditioning_schedule(step, total_steps):
            progress = step / total_steps
            if progress < 0.3:  # Primeros 30% - adherencia fuerte
                return 1.4
            elif progress < 0.7:  # 30-70% - adherencia media
                return 1.0
            else:  # Últimos 30% - adherencia suave para detalles
                return 0.7
        
        # Por ahora usaremos un valor medio ya que el scheduling requiere modificar el pipeline
        # En una implementación futura se podría hacer callback-based scheduling
        avg_conditioning = 1.0
        
        with torch.autocast(device_type=self.device, dtype=self.dtype):
            output = self.pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=layout_image,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                controlnet_conditioning_scale=avg_conditioning,
                width=width,
                height=height,
                guess_mode=False
            )
        
        image = output.images[0]
        image.save(output_path)
        print(f"Plano con conditioning adaptativo guardado en {output_path}")
        return image

    def batch_generate_strategies(self, 
                                layout_image: Image.Image,
                                prompt: str,
                                negative_prompt: str = "",
                                output_dir: str = "output/images/") -> List[Image.Image]:
        """
        Genera múltiples versiones usando diferentes estrategias para comparar.
        """
        os.makedirs(output_dir, exist_ok=True)
        results = []
        
        strategies = ["strict", "balanced", "creative", "multi_pass"]
        
        for strategy in strategies:
            print(f"\nGenerando con estrategia: {strategy}")
            output_path = os.path.join(output_dir, f"floorplan_{strategy}.png")
            
            try:
                image = self.generate_from_layout(
                    layout_image=layout_image,
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    output_path=output_path,
                    strategy=strategy
                )
                results.append(image)
            except Exception as e:
                print(f"Error con estrategia {strategy}: {e}")
                results.append(None)
        
        return results