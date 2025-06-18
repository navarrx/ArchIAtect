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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(5)].map((_, index) => (
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

  if (blueprints.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium mb-2">No blueprints yet</h3>
        <p className="text-muted-foreground">
          Generate your first blueprint to see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blueprints.map((blueprint, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
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
              className="h-96 relative"
            >
              <SwiperSlide>
                <img
                  src={blueprint.sd_image_url}
                  alt={`${blueprint.prompt} - Stable Diffusion`}
                  className="w-full h-full object-contain bg-gray-50"
                />
              </SwiperSlide>
              <SwiperSlide>
                <img
                  src={blueprint.layout_image_url}
                  alt={`${blueprint.prompt} - Layout`}
                  className="w-full h-full object-contain bg-gray-50"
                />
              </SwiperSlide>
              <div className="swiper-button-prev !text-black !w-8 !h-8 after:!text-2xl"></div>
              <div className="swiper-button-next !text-black !w-8 !h-8 after:!text-2xl"></div>
            </Swiper>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2 line-clamp-2">{blueprint.prompt || "Untitled Blueprint"}</h3>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <p>Plano generado automáticamente</p>
                <p>{new Date(blueprint.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
