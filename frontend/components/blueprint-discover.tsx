"use client"
import { useEffect, useState, useRef, useCallback } from 'react'
import axios from 'axios'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { motion } from 'framer-motion'
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

  const lastBlueprintElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, hasMore])

  const fetchBlueprints = async (pageNum: number, reset: boolean = false) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: PAGE_SIZE.toString(),
        sort: sortOrder,
        ...(dateFilter && { date: format(dateFilter, 'yyyy-MM-dd') })
      })

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/floorplans/?${params}`)
      const newBlueprints = response.data

      if (reset) {
        setBlueprints(newBlueprints)
      } else {
        setBlueprints(prev => [...prev, ...newBlueprints])
      }

      // Para usuarios no autenticados, limitar el total de planos mostrados
      const totalBlueprints = reset ? newBlueprints.length : blueprints.length + newBlueprints.length
      if (!isAuthenticated && totalBlueprints >= MAX_BLUEPRINTS_GUEST) {
        setHasMore(false)
      } else {
        setHasMore(newBlueprints.length === PAGE_SIZE)
      }
    } catch (error) {
      console.error("Error fetching layouts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    setBlueprints([])
    setLoading(true)
    fetchBlueprints(1, true)
  }, [sortOrder, dateFilter])

  useEffect(() => {
    if (page > 1) {
      fetchBlueprints(page)
    }
  }, [page])

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

  const truncatePrompt = (prompt: string, maxWords: number = 10) => {
    const words = prompt.split(' ')
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(' ') + '...'
    }
    return prompt
  }

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
          <div key={index} className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
            <Skeleton className="h-64 w-full" />
            <div className="p-6">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Auth Banner for Guest Users */}
      {!isAuthenticated && (
        <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Acceso Limitado
                </h3>
                <p className="text-gray-600">
                  Regístrate o inicia sesión para ver más planos y descargar imágenes
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm" asChild className="rounded-xl">
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Link>
              </Button>
              <Button size="sm" asChild className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Link href="/register">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Registrarse
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Filtrar por fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal rounded-xl border-gray-200 hover:border-purple-500 focus:border-purple-500"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? (
                    format(dateFilter, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
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
            <Label htmlFor="sort-order" className="text-sm font-medium text-gray-700">Ordenar por</Label>
            <Select value={sortOrder} onValueChange={handleSortChange}>
              <SelectTrigger id="sort-order" className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
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
              className="text-gray-600 hover:text-gray-900 rounded-xl"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Blueprints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blueprints.map((blueprint, index) => (
          <motion.div
            key={blueprint.id}
            ref={index === blueprints.length - 1 ? lastBlueprintElementRef : null}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card 
              className="group overflow-hidden rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 cursor-pointer bg-white"
              onClick={() => setSelectedBlueprint(blueprint)}
            >
              <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100">
                <img 
                  src={blueprint.sd_image_url} 
                  alt={blueprint.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center justify-center">
                    <Eye className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Ver detalles</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-3 leading-tight">
                  {truncatePrompt(blueprint.prompt)}
                </h2>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{new Date(blueprint.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedBlueprint} onOpenChange={() => setSelectedBlueprint(null)}>
        <DialogContent className="max-w-4xl rounded-2xl">
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
                  <SwiperSlide>
                    <img 
                      src={selectedBlueprint.sd_image_url} 
                      alt={`${selectedBlueprint.prompt} - Stable Diffusion`} 
                      className="w-full h-full object-contain bg-gray-50" 
                    />
                  </SwiperSlide>
                  <SwiperSlide>
                    <img 
                      src={selectedBlueprint.layout_image_url} 
                      alt={`${selectedBlueprint.prompt} - Layout`} 
                      className="w-full h-full object-contain bg-gray-50" 
                    />
                  </SwiperSlide>
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
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {new Date(selectedBlueprint.created_at).toLocaleDateString()}
                  </p>
                </div>
                {isAuthenticated ? (
                  <Button 
                    className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                    onClick={() => handleDownload(selectedBlueprint)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar plano
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200/50">
                      <div className="flex items-center space-x-3">
                        <Lock className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Acceso restringido</p>
                          <p className="text-sm text-gray-600">Inicia sesión para descargar planos</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline" className="flex-1 rounded-xl" asChild>
                        <Link href="/login">
                          <LogIn className="w-4 h-4 mr-2" />
                          Iniciar Sesión
                        </Link>
                      </Button>
                      <Button className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" asChild>
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