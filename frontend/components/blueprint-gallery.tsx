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
import { motion } from 'framer-motion'
import { Building2, Clock, Eye } from "lucide-react"

export default function BlueprintGallery() {
  const [blueprints, setBlueprints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentBlueprints = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/floorplans/recent`, {
          params: { limit: 5 }
        })
        setBlueprints(response.data)
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(5)].map((_, index) => (
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

  if (blueprints.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Aún no hay planos</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Genera tu primer plano para verlo aquí en la galería.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {blueprints.map((blueprint, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="group overflow-hidden rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 cursor-pointer bg-white">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100">
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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </SwiperSlide>
                <SwiperSlide>
                  <img
                    src={blueprint.layout_image_url}
                    alt={`${blueprint.prompt} - Layout`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
              <h3 className="font-semibold mb-2 line-clamp-2 text-gray-900 leading-tight">
                {truncatePrompt(blueprint.prompt || "Plano sin título")}
              </h3>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-2" />
                <span>{new Date(blueprint.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
