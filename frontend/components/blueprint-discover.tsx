"use client"
import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react'
import axios from 'axios'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Calendar as CalendarIcon, X, Clock, ChevronRight, Filter, Eye, Download, Search, Lock, UserPlus, LogIn } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"

interface Blueprint {
  id: number
  prompt: string
  layout_image_url: string
  sd_image_url: string
  created_at: string
}

export default function BlueprintDiscover() {
  const { isAuthenticated } = useAuth()
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null)
  const observer = useRef<IntersectionObserver>()
  
  // Limitar planos para usuarios no autenticados
  const PAGE_SIZE = isAuthenticated ? 9 : 6
  const MAX_BLUEPRINTS_GUEST = 12 // Máximo 12 planos para usuarios no autenticados

  const hasActiveFilters = dateFilter !== undefined || sortOrder !== 'newest'

  const lastBlueprintElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || !hasMore) return
    if (observer.current) observer.current.disconnect()
    
    if (node) {
      observer.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(prevPage => prevPage + 1)
      }
        },
        {
          rootMargin: '200px', // Cargar antes de llegar al final
          threshold: 0.1
        }
      )
      observer.current.observe(node)
    }
  }, [loading, hasMore])

  const fetchBlueprints = useCallback(async (pageNum: number, reset: boolean = false) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: PAGE_SIZE.toString(),
        sort: sortOrder,
        ...(dateFilter && { date: format(dateFilter, 'yyyy-MM-dd') })
      })

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/floorplans/?${params}`)
      const newBlueprints = response.data

      setBlueprints(prev => {
        let updated: Blueprint[]

      if (reset) {
          updated = newBlueprints
      } else {
          updated = [...prev, ...newBlueprints]
      }

      // Para usuarios no autenticados, limitar el total de planos mostrados
        if (!isAuthenticated) {
          if (updated.length >= MAX_BLUEPRINTS_GUEST) {
        setHasMore(false)
            return updated.slice(0, MAX_BLUEPRINTS_GUEST)
          }
          // Si aún no alcanzamos el límite pero no hay más resultados
          setHasMore(newBlueprints.length === PAGE_SIZE && updated.length < MAX_BLUEPRINTS_GUEST)
      } else {
        setHasMore(newBlueprints.length === PAGE_SIZE)
      }
        
        return updated
      })
    } catch (error) {
      console.error("Error fetching layouts:", error)
    } finally {
      setLoading(false)
    }
  }, [sortOrder, dateFilter, PAGE_SIZE, isAuthenticated, MAX_BLUEPRINTS_GUEST])

  useEffect(() => {
    setPage(1)
    setBlueprints([])
    setLoading(true)
    setHasMore(true)
    if (observer.current) {
      observer.current.disconnect()
    }
    fetchBlueprints(1, true)
  }, [sortOrder, dateFilter, fetchBlueprints])

  useEffect(() => {
    if (page > 1 && !loading) {
      fetchBlueprints(page)
    }
  }, [page, fetchBlueprints, loading])

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [])

  const handleSortChange = (value: string) => {
    setSortOrder(value as 'newest' | 'oldest')
  }

  const handleDateSelect = (date: Date | undefined) => {
    setDateFilter(date)
  }

  const clearFilters = () => {
    setDateFilter(undefined)
    setSortOrder('newest')
  }

  const truncatePrompt = useCallback((prompt: string, maxWords: number = 10) => {
    const words = prompt.split(' ')
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(' ') + '...'
    }
    return prompt
  }, [])

  // Memoizar las cards para evitar re-renders innecesarios
  const BlueprintCard = memo(({ 
    blueprint, 
    isLast, 
    onSelect, 
    truncatePrompt,
    lastElementRef
  }: { 
    blueprint: Blueprint
    isLast: boolean
    onSelect: (blueprint: Blueprint) => void
    truncatePrompt: (prompt: string) => string
    lastElementRef: (node: HTMLDivElement | null) => void
  }) => {
    const cardRef = useRef<HTMLDivElement>(null)
    
    useEffect(() => {
      if (isLast && cardRef.current) {
        lastElementRef(cardRef.current)
      }
    }, [isLast, lastElementRef])

    const handleClick = useCallback(() => {
      onSelect(blueprint)
    }, [blueprint, onSelect])

    const formattedDate = useMemo(() => 
      new Date(blueprint.created_at).toLocaleDateString(), 
      [blueprint.created_at]
    )

    return (
      <div ref={cardRef} className="scroll-optimized">
        <Card 
          className="group overflow-hidden rounded-2xl arch-shadow border-border/50 bg-card cursor-pointer hover:arch-shadow-lg transition-shadow duration-200"
          onClick={handleClick}
        >
          <div className="relative aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted/30 overflow-hidden">
            <img 
              src={blueprint.sd_image_url} 
              alt={blueprint.prompt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ease-out"
              loading="lazy"
              decoding="async"
              style={{ 
                willChange: 'transform',
                contentVisibility: 'auto'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="flex items-center justify-center">
                <Eye className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Ver detalles</span>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold line-clamp-2 mb-3 leading-tight">
              {truncatePrompt(blueprint.prompt)}
            </h2>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  })

  BlueprintCard.displayName = 'BlueprintCard'

  const handleDownload = (blueprint: Blueprint) => {
    if (!isAuthenticated) {
      return // No permitir descarga para usuarios no autenticados
    }
    
    const imageUrl = blueprint.sd_image_url || blueprint.layout_image_url
    if (imageUrl) {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `descubrir-${blueprint.id}-${new Date().getTime()}.png`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading && blueprints.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="rounded-2xl overflow-hidden arch-shadow border-border/50 bg-card">
            <Skeleton className="h-64 w-full" />
            <div className="p-6">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Auth Banner for Guest Users */}
      {!isAuthenticated && (
        <Card className="p-6 arch-shadow border-border/50 bg-card">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center arch-shadow">
                <Lock className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Acceso Limitado
                </h3>
                <p className="text-muted-foreground">
                  Regístrate o inicia sesión para ver más planos y descargar imágenes
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm" asChild className="rounded-xl arch-shadow hover:arch-shadow-lg transition-all duration-300">
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Link>
              </Button>
              <Button size="sm" asChild className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 arch-shadow-lg hover:scale-105 transition-all duration-300">
                <Link href="/register">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Registrarse
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters Section */}
      <Card className="p-6 arch-shadow border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Filtrar por fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal rounded-xl arch-shadow hover:arch-shadow-lg transition-all duration-300"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? (
                    format(dateFilter, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl arch-shadow-lg" align="start">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={handleDateSelect}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort-order" className="text-sm font-medium">Ordenar por</Label>
            <Select value={sortOrder} onValueChange={handleSortChange}>
              <SelectTrigger id="sort-order" className="rounded-xl arch-shadow hover:arch-shadow-lg transition-all duration-300">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent className="arch-shadow-lg">
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="rounded-xl arch-shadow hover:arch-shadow-lg transition-all duration-300"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar filtros
            </Button>
          </div>
        )}
      </Card>

      {/* Blueprints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blueprints.map((blueprint, index) => (
          <BlueprintCard
            key={blueprint.id}
            blueprint={blueprint}
            isLast={index === blueprints.length - 1}
            onSelect={setSelectedBlueprint}
            truncatePrompt={truncatePrompt}
            lastElementRef={lastBlueprintElementRef}
          />
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedBlueprint} onOpenChange={() => setSelectedBlueprint(null)}>
        <DialogContent className="max-w-5xl rounded-2xl arch-shadow-lg border-border/50 bg-card/95">
          {selectedBlueprint && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    Plano #{selectedBlueprint.id}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {new Date(selectedBlueprint.created_at).toLocaleDateString()}
                  </span>
                </div>

                <Swiper
                  modules={[Navigation, Pagination]}
                  spaceBetween={0}
                  slidesPerView={1}
                  navigation
                  pagination={{ clickable: true }}
                  className="aspect-square rounded-2xl overflow-hidden arch-shadow bg-muted/40"
                >
                  <SwiperSlide>
                    <img 
                      src={selectedBlueprint.sd_image_url} 
                      alt={`${selectedBlueprint.prompt} - Stable Diffusion`} 
                      className="w-full h-full object-contain bg-muted/50" 
                      loading="lazy"
                      decoding="async"
                    />
                  </SwiperSlide>
                  <SwiperSlide>
                    <img 
                      src={selectedBlueprint.layout_image_url} 
                      alt={`${selectedBlueprint.prompt} - Layout`} 
                      className="w-full h-full object-contain bg-muted/50" 
                      loading="lazy"
                      decoding="async"
                    />
                  </SwiperSlide>
                </Swiper>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <DialogTitle className="text-xl font-semibold leading-tight">Detalles del Plano</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Vista generada por IA y layout base. Guarda y descarga para trabajar sobre el diseño.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">Descripción</h3>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-sm text-foreground leading-relaxed">{selectedBlueprint.prompt}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-card border border-border/50 arch-shadow">
                    <p className="text-xs text-muted-foreground mb-1">ID</p>
                    <p className="text-sm font-semibold">#{selectedBlueprint.id}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border/50 arch-shadow">
                    <p className="text-xs text-muted-foreground mb-1">Creado</p>
                    <p className="text-sm font-semibold">
                    {new Date(selectedBlueprint.created_at).toLocaleDateString()}
                  </p>
                  </div>
                </div>

                {isAuthenticated ? (
                  <Button 
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 arch-shadow-lg"
                    onClick={() => handleDownload(selectedBlueprint)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar plano
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-muted/40 rounded-xl border border-border/50">
                      <div className="flex items-center space-x-3">
                        <Lock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Acceso restringido</p>
                          <p className="text-sm text-muted-foreground">Inicia sesión para descargar planos</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline" className="flex-1 rounded-xl arch-shadow" asChild>
                        <Link href="/login">
                          <LogIn className="w-4 h-4 mr-2" />
                          Iniciar Sesión
                        </Link>
                      </Button>
                      <Button className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 arch-shadow-lg" asChild>
                        <Link href="/register">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Registrarse
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* End of results */}
      {!hasMore && blueprints.length > 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">
            {!isAuthenticated && blueprints.length >= MAX_BLUEPRINTS_GUEST 
              ? "Has alcanzado el límite de planos para usuarios no registrados"
              : "No hay más planos para mostrar"
            }
          </p>
          {!isAuthenticated && blueprints.length >= MAX_BLUEPRINTS_GUEST && (
            <div className="mt-4">
              <Button asChild className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Link href="/register">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Registrarse para ver más
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && blueprints.length === 0 && (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron planos</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            No hay planos que coincidan con los filtros seleccionados. Intenta ajustar tus criterios de búsqueda.
          </p>
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="rounded-xl"
          >
            Limpiar Filtros
          </Button>
        </div>
      )}
    </div>
  )
}