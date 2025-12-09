"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Building2, Clock, Eye, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function BlueprintGallery() {
  const [blueprints, setBlueprints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    const fetchRecentBlueprints = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return

        // Obtener las 5 últimas generaciones
        const recentResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/floorplans/recent`, {
          params: { limit: 5 },
          headers: { Authorization: `Bearer ${token}` }
        })
        setBlueprints(recentResponse.data)

        // Verificar si hay más de 5 generaciones
        const totalResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/floorplans/my`, {
          params: { limit: 6, page: 1 }, // Pedimos 6 para saber si hay más de 5
          headers: { Authorization: `Bearer ${token}` }
        })
        
        setHasMore(totalResponse.data.length > 5)
      } catch (error) {
        console.error("Error fetching recent blueprints:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentBlueprints()
  }, [])

  const truncatePrompt = (prompt: string, maxWords: number = 10) => {
    const words = prompt.split(' ')
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(' ') + '...'
    }
    return prompt
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(5)].map((_, index) => (
            <Card key={index} className="rounded-2xl overflow-hidden arch-shadow border-border/50 bg-card/50 backdrop-blur-sm">
              <Skeleton className="h-64 w-full" />
              <div className="p-6">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (blueprints.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 arch-shadow">
          <Building2 className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Aún no hay planos</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Genera tu primer plano para verlo aquí en la galería.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con descripción */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Últimas 5 generaciones</h3>
          <p className="text-sm text-muted-foreground">
            Tus planos más recientes
          </p>
        </div>
      </div>

      {/* Grid de planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blueprints.map((blueprint, index) => (
          <Card 
            key={blueprint.id || index}
            className="group overflow-hidden rounded-2xl arch-shadow border-border/50 bg-card/50 backdrop-blur-sm card-3d"
          >
            <div className="relative aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted/30">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={0}
                slidesPerView={1}
                navigation={{
                  nextEl: '.swiper-button-next',
                  prevEl: '.swiper-button-prev',
                }}
                pagination={{ clickable: true }}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                className="w-full h-full"
              >
                <SwiperSlide>
                  <img
                    src={blueprint.sd_image_url}
                    alt={`${blueprint.prompt} - Stable Diffusion`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </SwiperSlide>
                <SwiperSlide>
                  <img
                    src={blueprint.layout_image_url}
                    alt={`${blueprint.prompt} - Layout`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </SwiperSlide>
                <div className="swiper-button-prev !text-white !w-8 !h-8 after:!text-2xl !bg-black/20 !rounded-full !backdrop-blur-sm"></div>
                <div className="swiper-button-next !text-white !w-8 !h-8 after:!text-2xl !bg-black/20 !rounded-full !backdrop-blur-sm"></div>
              </Swiper>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center justify-center">
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Ver detalles</span>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 line-clamp-2 leading-tight">
                {truncatePrompt(blueprint.prompt || "Plano sin título")}
              </h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span>{new Date(blueprint.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Card adicional para ver todas las generaciones */}
        {hasMore && (
          <Link href="/my-blueprints" className="block">
            <Card className="group overflow-hidden rounded-2xl arch-shadow border-border/50 bg-card/50 backdrop-blur-sm card-3d cursor-pointer border-2 border-dashed hover:border-primary/50 transition-all duration-300 h-full">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 arch-shadow group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">Ver todas mis generaciones</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Explora tu biblioteca completa de planos
                  </p>
                  <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-border/50 bg-background/50 arch-shadow group-hover:arch-shadow-lg transition-all duration-300">
                    <span className="text-sm font-medium">Ver todas</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )}
      </div>
    </div>
  )
}
