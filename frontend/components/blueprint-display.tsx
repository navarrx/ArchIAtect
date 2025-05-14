"use client"

import { Loader2, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BlueprintDisplayProps {
  layoutImage: string | null
  sdImage: string | null
  loading: boolean
}

export default function BlueprintDisplay({ layoutImage, sdImage, loading }: BlueprintDisplayProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageLoadError, setImageLoadError] = useState<{[key: string]: boolean}>({})
  
  const images = [
    { url: sdImage, label: "AI Enhanced View", description: "Stable Diffusion enhanced architectural visualization" },
    { url: layoutImage, label: "Floor Plan Layout", description: "Technical graph generated layout with room labels" }
  ].filter(img => img.url !== null)

  useEffect(() => {
    // Reset current index when images change
    setCurrentImageIndex(0)
    setImageLoadError({})
  }, [layoutImage, sdImage])

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleImageError = (imageUrl: string) => {
    console.error(`Failed to load image: ${imageUrl}`)
    setImageLoadError(prev => ({ ...prev, [imageUrl]: true }))
  }

  return (
    <TooltipProvider>
      <Card className="flex items-center justify-center min-h-[500px]">
        <CardContent className="p-6 w-full h-full flex flex-col items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 className="h-16 w-16 animate-spin mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Generating your blueprint...</p>
              <p className="text-xs text-muted-foreground mt-2">This may take a moment</p>
            </div>
          ) : images.length > 0 ? (
            <div className="relative w-full h-full flex flex-col items-center">
              <div className="relative w-full flex-1 flex items-center justify-center">
                {imageLoadError[images[currentImageIndex].url!] ? (
                  <div className="text-center text-red-500">
                    <p>Failed to load image</p>
                    <p className="text-sm">Please try generating again</p>
                  </div>
                ) : (
                  <div className="relative group">
                    <img
                      src={images[currentImageIndex].url || "/placeholder.svg"}
                      alt={images[currentImageIndex].label}
                      className="max-w-full max-h-[450px] object-contain"
                      onError={() => handleImageError(images[currentImageIndex].url!)}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            window.open(images[currentImageIndex].url!, '_blank')
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Abrir en nueva pestaña</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? "bg-primary" : "bg-muted"
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
              <div className="text-center mt-2">
                <p className="font-medium">{images[currentImageIndex].label}</p>
                <p className="text-sm text-muted-foreground">{images[currentImageIndex].description}</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <img
                src="/placeholder.svg?height=300&width=400"
                alt="Blueprint placeholder"
                className="mx-auto mb-4 opacity-20"
              />
              <p className="text-muted-foreground">Your generated blueprint will appear here</p>
              <p className="text-xs text-muted-foreground mt-2">Adjust parameters and click Generate</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
