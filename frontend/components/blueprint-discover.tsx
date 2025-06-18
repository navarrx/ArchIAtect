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
import { Loader2, Calendar as CalendarIcon, X, Clock, ChevronRight } from "lucide-react"
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

interface Blueprint {
  id: number
  prompt: string
  layout_image_url: string
  sd_image_url: string
  created_at: string
}

export default function BlueprintDiscover() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null)
  const observer = useRef<IntersectionObserver>()
  const PAGE_SIZE = 9

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

      setHasMore(newBlueprints.length === PAGE_SIZE)
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

  if (loading && blueprints.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <Skeleton className="h-96 w-full" />
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label>Filtrar por fecha</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? (
                  format(dateFilter, "PPP", { locale: es })
                ) : (
                  <span>Seleccionar fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
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
        <div className="w-full md:w-48">
          <Label htmlFor="sort-order">Ordenar por</Label>
          <Select value={sortOrder} onValueChange={handleSortChange}>
            <SelectTrigger id="sort-order">
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
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar filtros
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blueprints.map((blueprint, index) => (
          <motion.div
            key={blueprint.id}
            ref={index === blueprints.length - 1 ? lastBlueprintElementRef : null}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card 
              className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => setSelectedBlueprint(blueprint)}
            >
              <div className="relative aspect-[4/3]">
                <img 
                  src={blueprint.sd_image_url} 
                  alt={blueprint.prompt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-medium">Ver detalles</p>
                </div>
              </div>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold line-clamp-2 mb-2">
                  {truncatePrompt(blueprint.prompt)}
                </h2>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{new Date(blueprint.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!selectedBlueprint} onOpenChange={() => setSelectedBlueprint(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalles del Plano</DialogTitle>
          </DialogHeader>
          {selectedBlueprint && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Swiper
                  modules={[Navigation, Pagination]}
                  spaceBetween={0}
                  slidesPerView={1}
                  navigation
                  pagination={{ clickable: true }}
                  className="aspect-square"
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
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                  <p className="text-muted-foreground">{selectedBlueprint.prompt}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Fecha de creación</h3>
                  <p className="text-muted-foreground">
                    {new Date(selectedBlueprint.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button className="w-full">
                  Descargar plano
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!hasMore && blueprints.length > 0 && (
        <div className="text-center py-4 text-muted-foreground">
          No hay más planos para mostrar
        </div>
      )}

      {!loading && blueprints.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No se encontraron planos con los filtros seleccionados</p>
        </div>
      )}
    </div>
  )
}