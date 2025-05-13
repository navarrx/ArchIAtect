"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

export default function BlueprintGallery() {
  const [blueprints, setBlueprints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentBlueprints = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/floorplans/recent`, {
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
            <Skeleton className="h-48 w-full" />
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
        <Card key={index} className="overflow-hidden">
          <div className="relative h-48 w-full">
            {blueprint.layout_image_url ? (
              <img
                src={blueprint.layout_image_url}
                alt={`Blueprint ${index + 1}`}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted">
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-medium truncate">{blueprint.prompt || "Untitled Blueprint"}</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(blueprint.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
