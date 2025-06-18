"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface FavouriteButtonProps {
  generationId: number
  isFavourite: boolean
  onToggle?: (isFavourite: boolean) => void
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
  className?: string
}

export default function FavouriteButton({
  generationId,
  isFavourite,
  onToggle,
  size = "default",
  variant = "outline",
  className = ""
}: FavouriteButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentIsFavourite, setCurrentIsFavourite] = useState(isFavourite)
  const { toast } = useToast()
  const router = useRouter()

  const handleToggle = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("authToken")
      if (!token) {
        router.push("/login")
        return
      }

      if (currentIsFavourite) {
        // Quitar de favoritos - necesitamos obtener el ID del favorito
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/favourites/my/basic`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          const favourites = await response.json()
          const favourite = favourites.find((fav: any) => fav.generation_id === generationId)
          
          if (favourite) {
            const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/favourites/${favourite.id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (deleteResponse.ok) {
              setCurrentIsFavourite(false)
              onToggle?.(false)
              toast({
                title: "Quitado de favoritos",
                description: "El plano ha sido quitado de tus favoritos",
              })
            }
          }
        }
      } else {
        // Agregar a favoritos
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/favourites/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            generation_id: generationId
          }),
        })

        if (response.ok) {
          setCurrentIsFavourite(true)
          onToggle?.(true)
          toast({
            title: "Agregado a favoritos",
            description: "El plano ha sido agregado a tus favoritos",
          })
        } else {
          const errorData = await response.json()
          throw new Error(errorData.detail || "No se pudo agregar a favoritos")
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al manejar favoritos",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant={variant}
      size={size === "sm" ? "icon" : size === "lg" ? "default" : "icon"}
      onClick={handleToggle}
      disabled={isLoading}
      className={`${currentIsFavourite ? "text-red-500 bg-red-50 hover:bg-red-100" : "text-muted-foreground"} ${className}`}
    >
      <Heart className={`${size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} ${isLoading ? "animate-pulse" : ""}`} />
      <span className="sr-only">
        {currentIsFavourite ? "Quitar de favoritos" : "Agregar a favoritos"}
      </span>
    </Button>
  )
} 