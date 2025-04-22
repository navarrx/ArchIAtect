"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { fetchAPI } from "@/lib/api"

interface Blueprint {
  id: string
  url: string
  title: string
  createdAt: string
}

export default function BlueprintGallery() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBlueprints = async () => {
      try {
        const data = await fetchAPI("blueprints")
        setBlueprints(data.blueprints || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        // For demo purposes, add some placeholder data
        setBlueprints([
          {
            id: "1",
            url: "/placeholder.svg?height=200&width=300",
            title: "Modern Living Room",
            createdAt: "2023-04-15T10:30:00Z",
          },
          {
            id: "2",
            url: "/placeholder.svg?height=200&width=300",
            title: "Minimalist Kitchen",
            createdAt: "2023-04-14T14:20:00Z",
          },
          {
            id: "3",
            url: "/placeholder.svg?height=200&width=300",
            title: "Traditional Bedroom",
            createdAt: "2023-04-13T09:15:00Z",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchBlueprints()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && blueprints.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-2">Error loading blueprints</p>
        <p className="text-muted-foreground">Please try again later</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blueprints.map((blueprint) => (
        <Card key={blueprint.id} className="overflow-hidden">
          <CardContent className="p-0">
            <img src={blueprint.url || "/placeholder.svg"} alt={blueprint.title} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="font-medium">{blueprint.title}</h3>
              <p className="text-xs text-muted-foreground">{new Date(blueprint.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      ))}

      {blueprints.length === 0 && (
        <div className="col-span-full text-center py-10">
          <p className="text-muted-foreground">No blueprints found</p>
          <p className="text-xs text-muted-foreground mt-2">Generate some blueprints to see them here</p>
        </div>
      )}
    </div>
  )
}
