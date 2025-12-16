"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Download, Loader2, Trash2, Heart, Filter, Calendar, Star, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

interface FavouriteBlueprint {
  id: number
  user_id: number
  generation_id: number
  created_at: string
  generation: {
    id: number
    prompt: string
    layout_image_url: string
    sd_image_url: string | null
    created_at: string
    status: string
    error_message: string | null
  }
}

export default function FavouritesPage() {
  const [favourites, setFavourites] = useState<FavouriteBlueprint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken")
      if (!token) {
        router.push("/login")
        return
      }

      fetchFavourites(token)
    }

    checkAuth()

    // Asegurar scroll arriba al entrar en la página
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [router])

  const fetchFavourites = async (token: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/favourites/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Error response:", errorData)
        throw new Error("No se pudieron obtener los favoritos")
      }

      const data = await response.json()
      console.log("Received favourites:", data)
      
      // Ordenar los favoritos según el criterio seleccionado
      const sortedData = data.sort((a: FavouriteBlueprint, b: FavouriteBlueprint) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB
      })

      setFavourites(sortedData || [])
    } catch (error) {
      console.error("Error fetching favourites:", error)
      setError(error instanceof Error ? error.message : "Ocurrió un error al cargar los favoritos")
      setFavourites([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFavourite = async (favouriteId: number) => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/favourites/${favouriteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("No se pudo quitar de favoritos")
      }

      // Remove the deleted favourite from the state
      setFavourites((prev) => prev.filter((fav) => fav.id !== favouriteId))

      toast({
        title: "Quitado de favoritos",
        description: "El plano ha sido quitado de tus favoritos",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al quitar de favoritos",
      })
    }
  }

  const handleDownload = async (blueprint: FavouriteBlueprint) => {
    try {
      const imageUrl = blueprint.generation.sd_image_url || blueprint.generation.layout_image_url
      if (!imageUrl) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No hay imagen disponible para descargar"
        })
        return
      }

      console.log(`Downloading image for favourite ${blueprint.id}:`, imageUrl)

      // Crear un enlace temporal para descargar
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `favorito-${blueprint.generation.id}-${new Date().getTime()}.png`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Descarga iniciada",
        description: `Descargando plano ${blueprint.generation.id}`
      })
    } catch (error) {
      console.error('Error downloading image:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al descargar la imagen"
      })
    }
  }

  const filteredFavourites = favourites.filter(favourite => {
    const matchesSearch = favourite.generation.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleSortChange = (value: string) => {
    console.log("Sort changed to:", value)
    setSortOrder(value as "newest" | "oldest")
    
    // Reordenar los favoritos existentes
    const sortedFavourites = [...favourites].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return value === "newest" ? dateB - dateA : dateA - dateB
    })
    setFavourites(sortedFavourites)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-arch-grid opacity-20" />
        <div className="absolute inset-0 arch-gradient-overlay" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando favoritos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-arch-grid opacity-20" />
      <div className="absolute inset-0 arch-gradient-overlay" />

      <div className="container mx-auto py-16 px-4 md:px-6 max-w-7xl relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12 fade-in-up">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Sparkles className="h-3 w-3 text-red-500" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Mis Favoritos
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Tu colección personal de planos más especiales. Aquí encontrarás todos los diseños que has marcado como favoritos.
        </p>
      </div>

        {/* Stats and Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 p-6 bg-card/70 rounded-2xl border border-border/50 arch-shadow fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="text-center md:text-left mb-4 md:mb-0">
          <div className="text-2xl font-bold text-gray-900">{filteredFavourites.length}</div>
          <div className="text-sm text-muted-foreground">
            {filteredFavourites.length === 1 ? 'favorito' : 'favoritos'} mostrados
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild className="rounded-xl">
            <Link href="/my-blueprints">
              <Calendar className="mr-2 h-4 w-4" />
              Mis Planos
            </Link>
          </Button>
          <Button asChild className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
            <Link href="/generator">
              <Sparkles className="mr-2 h-4 w-4" />
              Crear Nuevo Plano
            </Link>
          </Button>
        </div>
      </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 fade-in-up" style={{ animationDelay: "0.15s" }}>
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium text-gray-700">Buscar favoritos</Label>
          <div className="relative">
            <Input
              id="search"
              placeholder="Buscar por descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort" className="text-sm font-medium text-gray-700">Ordenar por</Label>
          <Select value={sortOrder} onValueChange={handleSortChange}>
            <SelectTrigger id="sort" className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más recientes</SelectItem>
              <SelectItem value="oldest">Más antiguos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

        {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          <p className="flex items-center">
            <AlertCircle className="mr-2 h-4 w-4" />
            {error}
          </p>
        </div>
      )}

        {filteredFavourites.length === 0 ? (
        <div className="text-center py-20">
          {favourites.length === 0 ? (
            <>
              <div className="mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aún no tienes favoritos</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Los planos que marques como favoritos aparecerán aquí para un acceso rápido.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  <Link href="/generator">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Crear Mi Primer Plano
                  </Link>
                </Button>
                <Button variant="outline" asChild className="rounded-xl">
                  <Link href="/my-blueprints">
                    <Calendar className="mr-2 h-4 w-4" />
                    Ver Mis Planos
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron favoritos</h3>
                <p className="text-gray-600">No hay favoritos que coincidan con los filtros aplicados.</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm("")}
                className="rounded-xl"
              >
                Limpiar Filtros
              </Button>
            </>
          )}
        </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 fade-in-up" style={{ animationDelay: "0.2s" }}>
            {filteredFavourites.map((favourite) => (
              <Card 
                key={favourite.id} 
                className="group overflow-hidden rounded-2xl border border-gray-200 hover:border-red-300 hover:shadow-xl transition-all duration-300 bg-white"
              >
                <CardContent className="p-0">
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                    {favourite.generation.sd_image_url || favourite.generation.layout_image_url ? (
                      <img
                        src={favourite.generation.sd_image_url || favourite.generation.layout_image_url}
                        alt={favourite.generation.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${
                      favourite.generation.sd_image_url || favourite.generation.layout_image_url ? 'hidden' : ''
                    }`}>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">Sin imagen</p>
                      </div>
                    </div>
                    
                    {/* Badge de favorito */}
                    <div className="absolute top-3 left-3">
                      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-2 rounded-full shadow-lg">
                        <Heart className="h-4 w-4" />
                      </div>
                    </div>
                    
                    {/* Badge de estado */}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                        favourite.generation.status === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                        favourite.generation.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {favourite.generation.status === 'success' ? 'Exitoso' :
                         favourite.generation.status === 'pending' ? 'Pendiente' :
                         favourite.generation.status === 'failed' ? 'Fallido' : favourite.generation.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                      {favourite.generation.prompt}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      Agregado el {new Date(favourite.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(favourite)}
                        disabled={!favourite.generation.sd_image_url && !favourite.generation.layout_image_url}
                        className="flex-1 rounded-xl border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Descargar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg">¿Quitar de favoritos?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600">
                              ¿Estás seguro de que quieres quitar este plano de tus favoritos? Esta acción se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveFavourite(favourite.id)}
                              className="bg-red-500 text-white hover:bg-red-600 rounded-xl"
                            >
                              Quitar de favoritos
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
} 