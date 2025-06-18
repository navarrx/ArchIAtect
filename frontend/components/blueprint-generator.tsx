"use client"

import React, { useState } from "react"
import axios from "axios"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import BlueprintDisplay from "@/components/blueprint-display"
import BlueprintGallery from "@/components/blueprint-gallery"
import { useAuth } from "@/hooks/useAuth.tsx"
import Link from "next/link"

export default function BlueprintGenerator() {
  const { isAuthenticated, isLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [layoutImage, setLayoutImage] = useState<string | null>(null)
  const [sdImage, setSdImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (prompt: string) => {
    if (!isAuthenticated) {
      return
    }

    setLoading(true)
    setError(null)
    setLayoutImage(null)
    setSdImage(null)

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/generate`, {
        prompt,
      })

      console.log("Response from backend:", response.data)
      
      if (!response.data.layout_image_url) {
        throw new Error("No layout image URL received from server")
      }

      setLayoutImage(response.data.layout_image_url)
      setSdImage(response.data.sd_image_url || null)
    } catch (err: any) {
      console.error("Error generating blueprint:", err)
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail)
      } else {
        setError(err.message || "An unknown error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  // 🟢 Handler para formulario "With Parameters"
  const handleParametersSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    // 🟢 Armamos el prompt solo con cantidades
    let promptParts = []

    const rooms = [
      { name: "bedroom", label: "bedroom" },
      { name: "bathroom", label: "bathroom" },
      { name: "kitchen", label: "kitchen" },
      { name: "livingRoom", label: "living room" },
      { name: "diningRoom", label: "dining room" },
      { name: "garage", label: "garage" },
      { name: "laundryRoom", label: "laundry room" },
    ]

    rooms.forEach(({ name, label }) => {
      const count = Number(formData.get(name))
      if (count > 0) {
        promptParts.push(`${count} ${label}`)
      }
    })

    // 🟣 Entryway como opcional
    if (formData.get("entryway")) {
      promptParts.push("1 entryway")
    }

    const prompt = `I need a house with ${promptParts.join(", ")}.`

    handleGenerate(prompt)
  }

  // 🟣 Handler para formulario "With Text"
  const handleTextSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const prompt = formData.get("prompt") as string

    handleGenerate(prompt)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Inicia sesión para generar planos</h2>
            <p className="text-muted-foreground">
              Necesitas iniciar sesión para poder generar planos arquitectónicos con nuestra IA.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/register">Registrarse</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="generator" className="w-full">
      <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
        <TabsTrigger value="generator">Generator</TabsTrigger>
        <TabsTrigger value="gallery">Gallery</TabsTrigger>
      </TabsList>

      <TabsContent value="generator" className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* 🔥 Nueva Tabs interna: Parameters vs Text */}
              <Tabs defaultValue="parameters" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="parameters">With Parameters</TabsTrigger>
                  <TabsTrigger value="text">With Text</TabsTrigger>
                </TabsList>

                {/* 🟢 With Parameters */}
                <TabsContent value="parameters">
                  <form onSubmit={handleParametersSubmit} className="space-y-6">
                    {/* Campos para cantidades de habitaciones */}
                    {[
                      { name: "bedroom", label: "Bedroom" },
                      { name: "bathroom", label: "Bathroom" },
                      { name: "kitchen", label: "Kitchen" },
                      { name: "livingRoom", label: "Living Room" },
                      { name: "diningRoom", label: "Dining Room" },
                      { name: "garage", label: "Garage" },
                      { name: "laundryRoom", label: "Laundry Room" },
                    ].map(({ name, label }) => (
                      <div key={name} className="flex items-center justify-between">
                        <Label htmlFor={name} className="mr-4">{label}</Label>
                        <Input
                          type="number"
                          name={name}
                          id={name}
                          defaultValue={name === "garage" || name === "laundryRoom" ? "0" : "1"}
                          min="0"
                          className="w-20"
                        />
                      </div>
                    ))}

                    {/* Checkbox para Entryway */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="entryway" className="mr-2 flex-shrink-0">Include Entryway</Label>
                      <input 
                        type="checkbox" 
                        name="entryway" 
                        id="entryway" 
                        className="h-5 w-5"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Floorplan"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* 🟣 With Text */}
                <TabsContent value="text">
                  <form onSubmit={handleTextSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="prompt">Describe your floor plan</Label>
                      <Textarea
                        name="prompt"
                        placeholder="Example: I need a modern home with 3 bedrooms, 2 bathrooms, a large kitchen and a garage."
                        className="resize-none"
                        rows={5}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </CardContent>
          </Card>

          <BlueprintDisplay 
            layoutImage={layoutImage} 
            sdImage={sdImage} 
            loading={loading} 
          />
        </div>
      </TabsContent>

      <TabsContent value="gallery">
        <BlueprintGallery />
      </TabsContent>
    </Tabs>
  )
}