"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Download, Loader2, Trash2, ChevronDown, Filter, Calendar, Heart, Sparkles, Building2, Star } from "lucide-react"
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
import FavouriteButton from "@/components/favourite-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import FeedbackForm from '@/components/feedback-form'

interface Blueprint {
  id: number
  prompt: string
  layout_image_url: string
  sd_image_url: string | null
  created_at: string
  status: string
  error_message: string | null
  is_favourite?: boolean
}

const truncatePrompt = (prompt: string, maxWords: number = 10) => {
  const words = prompt.split(' ')
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(' ') + '...'
  }
  return prompt
}

export default function MyBlueprintsPage() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const router = useRouter()
  const { toast } = useToast()
  const observer = useRef<IntersectionObserver>()
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null)
  const [feedback, setFeedback] = useState<any | null>(null)
  const [loadingFeedback, setLoadingFeedback] = useState(false)

  const lastBlueprintElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading || isLoadingMore) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [isLoading, isLoadingMore, hasMore])

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken")
      if (!token) {
        router.push("/login")
        return
      }

      fetchBlueprints(token, 1, true)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (page > 1) {
      const token = localStorage.getItem("authToken")
      if (token) {
        fetchBlueprints(token, page, false)
      }
    }
  }, [page])

  // Nuevo useEffect para manejar cambios en sortOrder
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (token && !isLoading) {
      fetchBlueprints(token, 1, true)
    }
  }, [sortOrder])

  useEffect(() => {
    if (selectedBlueprint) {
      setLoadingFeedback(true)
      const token = localStorage.getItem('authToken')
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ratings/my/generation/${selectedBlueprint.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            setFeedback(data)
          } else {
            setFeedback(null)
          }
        })
        .catch(() => setFeedback(null))
        .finally(() => setLoadingFeedback(false))
    } else {
      setFeedback(null)
    }
  }, [selectedBlueprint])

  const fetchBlueprints = async (token: string, pageNum: number, reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true)
        setPage(1)
      } else {
        setIsLoadingMore(true)
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "50", // Aumentar el límite para cargar más planos por página
        sort: sortOrder
      })

      console.log("Fetching blueprints with params:", params.toString())
      console.log("Current sortOrder state:", sortOrder)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/floorplans/my?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Response status:", response.status)
      if (!response.ok) {
        const errorData = await response.text()
        console.error("Error response:", errorData)
        throw new Error("No se pudieron obtener los planos")
      }

      const data = await response.json()
      console.log("Received data:", data)
      console.log("First blueprint date:", data?.[0]?.created_at)
      console.log("Last blueprint date:", data?.[data.length - 1]?.created_at)
      
      // Verificar el estado de favoritos para cada plano
      const blueprintsWithFavourites = await Promise.all(
        data.map(async (blueprint: Blueprint) => {
          try {
            const favResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/favourites/check/${blueprint.id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            if (favResponse.ok) {
              const favData = await favResponse.json()
              return { ...blueprint, is_favourite: favData.is_favourite }
            }
            return { ...blueprint, is_favourite: false }
          } catch (error) {
            console.error(`Error checking favourite status for blueprint ${blueprint.id}:`, error)
            return { ...blueprint, is_favourite: false }
          }
        })
      )
      
      if (reset) {
        setBlueprints(blueprintsWithFavourites || [])
      } else {
        setBlueprints(prev => [...prev, ...(blueprintsWithFavourites || [])])
      }

      // Si recibimos menos de 50 planos, no hay más páginas
      setHasMore((data || []).length === 50)
    } catch (error) {
      console.error("Error fetching blueprints:", error)
      setError(error instanceof Error ? error.message : "Ocurrió un error al cargar los planos")
      if (reset) {
        setBlueprints([])
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("authToken")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/floorplans/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("No se pudo eliminar el plano")
      }

      // Remove the deleted blueprint from the state
      setBlueprints((prev) => prev.filter((blueprint) => blueprint.id !== id))

      toast({
        title: "Plano eliminado",
        description: "El plano ha sido eliminado correctamente",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al eliminar el plano",
      })
    }
  }

  const handleFavouriteToggle = (blueprintId: number, isFavourite: boolean) => {
    setBlueprints(prev => prev.map(bp => 
      bp.id === blueprintId ? { ...bp, is_favourite: isFavourite } : bp
    ))
  }

  const handleDownload = async (blueprint: Blueprint) => {
    try {
      const imageUrl = blueprint.sd_image_url || blueprint.layout_image_url
      if (!imageUrl) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No hay imagen disponible para descargar"
        })
        return
      }

      console.log(`Downloading image for blueprint ${blueprint.id}:`, imageUrl)

      // Crear un enlace temporal para descargar
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `plano-${blueprint.id}-${new Date().getTime()}.png`
      link.target = '_blank' // Abrir en nueva pestaña para evitar problemas de CORS
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Descarga iniciada",
        description: `Descargando plano ${blueprint.id}`
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

  const filteredBlueprints = blueprints.filter(blueprint => {
    const matchesSearch = blueprint.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleSortChange = (value: string) => {
    console.log("Sort changed to:", value)
    setSortOrder(value as "newest" | "oldest")
    // Removemos la llamada directa aquí, ahora se maneja con useEffect
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-7xl">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Sparkles className="h-3 w-3 text-blue-500" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Mis Planos
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Tu colección personal de diseños arquitectónicos. Aquí encontrarás todos los planos que has generado con ArchIAtect.
        </p>
      </div>

      {/* Stats and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <div className="text-2xl font-bold text-gray-900">{filteredBlueprints.length}</div>
          <div className="text-sm text-muted-foreground">
            {filteredBlueprints.length === 1 ? 'plano' : 'planos'} mostrados
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild className="rounded-xl">
            <Link href="/favourites">
              <Heart className="mr-2 h-4 w-4" />
              Mis Favoritos
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium text-gray-700">Buscar planos</Label>
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

      {filteredBlueprints.length === 0 ? (
        <div className="text-center py-20">
          {blueprints.length === 0 ? (
            <>
              <div className="mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building2 className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aún no has generado ningún plano</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Comienza a crear tus primeros diseños arquitectónicos con ArchIAtect.
                </p>
              </div>
              <Button asChild className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Link href="/generator">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Crear Mi Primer Plano
                </Link>
              </Button>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron planos</h3>
                <p className="text-gray-600">No hay planos que coincidan con los filtros aplicados.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlueprints.map((blueprint, index) => (
              <Card 
                key={blueprint.id} 
                className="group overflow-hidden rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 bg-white cursor-pointer"
                ref={index === filteredBlueprints.length - 1 ? lastBlueprintElementRef : null}
                onClick={() => setSelectedBlueprint(blueprint)}
              >
                <CardContent className="p-0">
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                    {blueprint.sd_image_url || blueprint.layout_image_url ? (
                      <img
                        src={blueprint.sd_image_url || blueprint.layout_image_url}
                        alt={blueprint.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${
                      blueprint.sd_image_url || blueprint.layout_image_url ? 'hidden' : ''
                    }`}>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">Sin imagen</p>
                      </div>
                    </div>
                    
                    {/* Badge de favorito */}
                    {blueprint.is_favourite && (
                      <div className="absolute top-3 left-3">
                        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-2 rounded-full shadow-lg">
                          <Heart className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                    
                    {/* Badge de estado */}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                        blueprint.status === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                        blueprint.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {blueprint.status === 'success' ? 'Exitoso' :
                         blueprint.status === 'pending' ? 'Pendiente' :
                         blueprint.status === 'failed' ? 'Fallido' : blueprint.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                      {truncatePrompt(blueprint.prompt)}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      Creado el {new Date(blueprint.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDownload(blueprint); }}
                        disabled={!blueprint.sd_image_url && !blueprint.layout_image_url}
                        className="flex-1 rounded-xl border-gray-200 hover:border-blue-500 hover:bg-blue-50 h-10"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Descargar
                      </Button>
                      <div onClick={e => e.stopPropagation()} className="h-10 flex items-center">
                        <FavouriteButton
                          generationId={blueprint.id}
                          isFavourite={blueprint.is_favourite || false}
                          onToggle={(isFavourite) => handleFavouriteToggle(blueprint.id, isFavourite)}
                        />
                      </div>
                      <div onClick={e => e.stopPropagation()} className="h-10 flex items-center">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-lg">¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600">
                                Esta acción no se puede deshacer. El plano será eliminado permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(blueprint.id.toString())}
                                className="bg-red-500 text-white hover:bg-red-600 rounded-xl"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Modal de Detalles */}
          <Dialog open={!!selectedBlueprint} onOpenChange={() => setSelectedBlueprint(null)}>
            <DialogContent className="max-w-4xl rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">Detalles del Plano</DialogTitle>
              </DialogHeader>
              {selectedBlueprint && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Swiper
                      modules={[Navigation, Pagination]}
                      spaceBetween={0}
                      slidesPerView={1}
                      navigation
                      pagination={{ clickable: true }}
                      className="aspect-square rounded-xl overflow-hidden"
                    >
                      {selectedBlueprint.sd_image_url && (
                        <SwiperSlide>
                          <img
                            src={selectedBlueprint.sd_image_url}
                            alt={`${selectedBlueprint.prompt} - Stable Diffusion`}
                            className="w-full h-full object-contain bg-gray-50"
                          />
                        </SwiperSlide>
                      )}
                      {selectedBlueprint.layout_image_url && (
                        <SwiperSlide>
                          <img
                            src={selectedBlueprint.layout_image_url}
                            alt={`${selectedBlueprint.prompt} - Layout`}
                            className="w-full h-full object-contain bg-gray-50"
                          />
                        </SwiperSlide>
                      )}
                    </Swiper>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
                      <p className="text-gray-600 leading-relaxed">{selectedBlueprint.prompt}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Fecha de creación</h3>
                      <p className="text-gray-600 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(selectedBlueprint.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {/* Feedback Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Reseña</h3>
                      {loadingFeedback ? (
                        <div className="text-muted-foreground">Cargando reseña...</div>
                      ) : feedback && feedback.rating ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map((star) => (
                              <Star key={star} className={`h-5 w-5 ${star <= feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          {feedback.feedback?.selected_criticisms?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {feedback.feedback.selected_criticisms.map((crit: string, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground border border-gray-200">{crit}</span>
                              ))}
                            </div>
                          )}
                          {feedback.feedback?.custom_feedback && (
                            <div className="mt-2 text-sm text-gray-700 bg-muted/50 rounded p-2">
                              {feedback.feedback.custom_feedback}
                            </div>
                          )}
                        </div>
                      ) : (
                        <FeedbackForm generationId={selectedBlueprint.id} onFeedbackSubmitted={() => setSelectedBlueprint(null)} />
                      )}
                    </div>
                    <Button
                      className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      onClick={() => handleDownload(selectedBlueprint)}
                      disabled={!selectedBlueprint.sd_image_url && !selectedBlueprint.layout_image_url}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar plano
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Loading indicator for infinite scroll */}
          {isLoadingMore && (
            <div className="flex justify-center mt-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* End of results indicator */}
          {!hasMore && blueprints.length > 0 && (
            <div className="text-center mt-8 py-4">
              <p className="text-muted-foreground">Has visto todos tus planos</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
