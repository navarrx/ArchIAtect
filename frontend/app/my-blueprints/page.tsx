"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Download, Loader2, Trash2, ChevronDown, Filter, Calendar } from "lucide-react"
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

interface Blueprint {
  id: number
  prompt: string
  layout_image_url: string
  sd_image_url: string | null
  created_at: string
  status: string
  error_message: string | null
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
      
      if (reset) {
        setBlueprints(data || [])
      } else {
        setBlueprints(prev => [...prev, ...(data || [])])
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
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mis Planos</h1>
          <p className="text-muted-foreground">
            {filteredBlueprints.length} de {blueprints.length} planos mostrados
          </p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link href="/generator">Crear Nuevo Plano</Link>
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <Label htmlFor="search">Buscar planos</Label>
          <Input
            id="search"
            placeholder="Buscar por descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="sort">Ordenar por</Label>
          <Select value={sortOrder} onValueChange={handleSortChange}>
            <SelectTrigger id="sort">
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
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}

      {filteredBlueprints.length === 0 ? (
        <div className="text-center py-16">
          {blueprints.length === 0 ? (
            <>
              <p className="text-muted-foreground mb-6">Aún no has generado ningún plano</p>
              <Button asChild>
                <Link href="/generator">Crear Mi Primer Plano</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">No se encontraron planos con los filtros aplicados</p>
              <Button variant="outline" onClick={() => {
                setSearchTerm("")
              }}>
                Limpiar Filtros
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlueprints.map((blueprint, index) => (
              <Card 
                key={blueprint.id} 
                className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300"
                ref={index === filteredBlueprints.length - 1 ? lastBlueprintElementRef : null}
              >
                <CardContent className="p-0">
                  <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                    {blueprint.sd_image_url || blueprint.layout_image_url ? (
                      <img
                        src={blueprint.sd_image_url || blueprint.layout_image_url}
                        alt={blueprint.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                        <div className="w-16 h-16 bg-muted-foreground/20 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Calendar className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <p className="text-xs text-muted-foreground">Sin imagen</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        blueprint.status === 'success' ? 'bg-green-100 text-green-800' :
                        blueprint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {blueprint.status === 'success' ? 'Exitoso' :
                         blueprint.status === 'pending' ? 'Pendiente' :
                         blueprint.status === 'failed' ? 'Fallido' : blueprint.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-1 line-clamp-2">{blueprint.prompt}</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Creado el {new Date(blueprint.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex justify-between">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleDownload(blueprint)}
                          disabled={!blueprint.sd_image_url && !blueprint.layout_image_url}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Descargar</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El plano será eliminado permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(blueprint.id.toString())}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
