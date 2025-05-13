"use client"
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import InfiniteScroll from 'react-infinite-scroll-component'

export default function BlueprintDiscover() {
  const [blueprints, setBlueprints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const fetchBlueprints = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/floorplans`, {
          params: { page, limit: 10 }
        })
        if (response.data.length > 0) {
          setBlueprints(prev => [...prev, ...response.data])  // Agrega los nuevos items a la lista
        } else {
          setHasMore(false)  // Si no hay más resultados, deshabilitamos la carga infinita
        }
      } catch (error) {
        console.error("Error fetching layouts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBlueprints()
  }, [page])

  if (loading) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <InfiniteScroll
        dataLength={blueprints.length}
        next={() => setPage(prev => prev + 1)} // Aumenta la página cuando el usuario hace scroll
        hasMore={hasMore}
        loader={<div>Loading...</div>}
        endMessage={<p className="text-center">¡Ya no hay más planos!</p>}
      >
        {blueprints.map((blueprint, index) => (
          <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* Carrusel de imágenes */}
            <Swiper spaceBetween={0} slidesPerView={1}>
              <SwiperSlide>
                <img 
                  src={blueprint.layout_image_url} 
                  alt={`${blueprint.prompt} - Layout`} 
                  className="w-full h-64 object-cover" 
                />
              </SwiperSlide>
              <SwiperSlide>
                <img 
                  src={blueprint.sd_image_url} 
                  alt={`${blueprint.prompt} - Stable Diffusion`} 
                  className="w-full h-64 object-cover" 
                />
              </SwiperSlide>
            </Swiper>

            {/* Info */}
            <div className="p-4">
              <h2 className="text-lg font-bold">{blueprint.prompt}</h2>
              <p className="text-sm text-gray-600">Plano generado automáticamente</p>
            </div>
          </div>
        ))}
      </InfiniteScroll>
    </div>
  )
}