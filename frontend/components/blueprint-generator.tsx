"use client"

import React, { useState, useCallback, useMemo } from "react"
import axios from "axios"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import BlueprintDisplay from "@/components/blueprint-display"
import BlueprintGallery from "@/components/blueprint-gallery"
import FeedbackForm from "@/components/feedback-form"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"
import { Building2 } from "lucide-react"

export default function BlueprintGenerator() {
  const { isAuthenticated, isLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [layoutImage, setLayoutImage] = useState<string | null>(null)
  const [sdImage, setSdImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generationId, setGenerationId] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  const handleGenerate = useCallback(async (prompt: string) => {
    if (!isAuthenticated) {
      return
    }

    setLoading(true)
    setError(null)
    setLayoutImage(null)
    setSdImage(null)
    setGenerationId(null)
    setShowFeedback(false)

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/generate`, {
        prompt,
      })
      
      if (!response.data.layout_image_url) {
        throw new Error("No layout image URL received from server")
      }

      setLayoutImage(response.data.layout_image_url)
      setSdImage(response.data.sd_image_url || null)
      setGenerationId(response.data.id)
      setShowFeedback(true)
    } catch (err: any) {
      console.error("Error generating blueprint:", err)
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError(err.message || "An unknown error occurred")
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const handleFeedbackSubmitted = useCallback(() => {
    setShowFeedback(false)
  }, [])

  // Memoize room configuration
  const roomConfig = useMemo(() => [
      { name: "bedroom", label: "bedroom" },
      { name: "bathroom", label: "bathroom" },
      { name: "kitchen", label: "kitchen" },
      { name: "livingRoom", label: "living room" },
      { name: "diningRoom", label: "dining room" },
      { name: "garage", label: "garage" },
      { name: "laundryRoom", label: "laundry room" },
  ], [])

  // Handler para formulario "With Parameters"
  const handleParametersSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const promptParts: string[] = []

    roomConfig.forEach(({ name, label }) => {
      const count = Number(formData.get(name))
      if (count > 0) {
        promptParts.push(`${count} ${label}`)
      }
    })

    if (formData.get("entryway")) {
      promptParts.push("1 entryway")
    }

    const prompt = `I need a house with ${promptParts.join(", ")}.`
    handleGenerate(prompt)
  }, [roomConfig, handleGenerate])

  // Handler para formulario "With Text"
  const handleTextSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const prompt = formData.get("prompt") as string

    if (prompt.trim()) {
    handleGenerate(prompt)
  }
  }, [handleGenerate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto fade-in-up">
        <Card className="arch-shadow border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-12 pb-12 px-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 arch-shadow">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Inicia sesión para generar planos</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Necesitas iniciar sesión para poder generar planos arquitectónicos con nuestra IA.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 arch-shadow-lg hover:scale-105 transition-transform duration-300">
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button variant="outline" asChild className="rounded-xl border-border/50 hover:bg-muted/50 arch-shadow hover:arch-shadow-lg transition-all duration-300">
                <Link href="/register">Registrarse</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Tabs defaultValue="generator" className="w-full">
      <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-muted/30 p-1 rounded-2xl mb-12 arch-shadow">
        <TabsTrigger value="generator" className="rounded-xl data-[state=active]:bg-background data-[state=active]:arch-shadow transition-all duration-300">
          Generador
        </TabsTrigger>
        <TabsTrigger value="gallery" className="rounded-xl data-[state=active]:bg-background data-[state=active]:arch-shadow transition-all duration-300">
          Galería
        </TabsTrigger>
      </TabsList>

      <TabsContent value="generator" className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="arch-shadow border-border/50 bg-card/50 backdrop-blur-sm card-3d">
            <CardContent className="pt-8 pb-8 px-8">
              {/* Tabs interna: Parameters vs Text */}
              <Tabs defaultValue="parameters" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 rounded-2xl mb-6 arch-shadow">
                  <TabsTrigger value="parameters" className="rounded-xl data-[state=active]:bg-background data-[state=active]:arch-shadow transition-all duration-300">
                    Con Parámetros
                  </TabsTrigger>
                  <TabsTrigger value="text" className="rounded-xl data-[state=active]:bg-background data-[state=active]:arch-shadow transition-all duration-300">
                    Con Texto
                  </TabsTrigger>
                </TabsList>

                {/* With Parameters */}
                <TabsContent value="parameters">
                  <form onSubmit={handleParametersSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {[
                        { name: "bedroom", label: "Dormitorios", icon: "🛏️" },
                        { name: "bathroom", label: "Baños", icon: "🚿" },
                        { name: "kitchen", label: "Cocina", icon: "🍳", max: 1 },
                        { name: "livingRoom", label: "Sala de Estar", icon: "🛋️", max: 1 },
                        { name: "diningRoom", label: "Comedor", icon: "🍽️", max: 1 },
                        { name: "garage", label: "Garaje", icon: "🚗", max: 1 },
                        { name: "laundryRoom", label: "Lavandería", icon: "👕", max: 1 },
                      ].map(({ name, label, icon, max }) => (
                        <div key={name} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 arch-shadow hover:arch-shadow-lg transition-all duration-300 group">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg group-hover:scale-110 transition-transform duration-300">{icon}</span>
                            <Label htmlFor={name} className="font-medium">{label}</Label>
                          </div>
                          <Input
                            type="number"
                            name={name}
                            id={name}
                            defaultValue={name === "garage" || name === "laundryRoom" ? "0" : "1"}
                            min="0"
                            max={max}
                            className="w-20 border-0 bg-background/50 rounded-lg focus:bg-background focus:ring-2 focus:ring-primary/20 arch-shadow"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Checkbox para Entryway */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 arch-shadow hover:arch-shadow-lg transition-all duration-300 group">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg group-hover:scale-110 transition-transform duration-300">🚪</span>
                        <Label htmlFor="entryway" className="font-medium">Incluir Entrada</Label>
                      </div>
                      <input 
                        type="checkbox" 
                        name="entryway" 
                        id="entryway" 
                        className="h-5 w-5 rounded border-border/50 focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 arch-shadow-lg hover:scale-105 transition-all duration-300" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        "Generar Plano"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* With Text */}
                <TabsContent value="text">
                  <form onSubmit={handleTextSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="prompt" className="text-sm font-medium">Describe tu plano</Label>
                      <Textarea
                        name="prompt"
                        placeholder="Ejemplo: Necesito una casa moderna con 3 dormitorios, 2 baños, una cocina grande y un garaje."
                        className="resize-none border-0 bg-muted/50 rounded-xl p-4 focus:bg-background focus:ring-2 focus:ring-primary/20 arch-shadow"
                        rows={5}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 arch-shadow-lg hover:scale-105 transition-all duration-300" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        "Generar"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl arch-shadow">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <BlueprintDisplay 
            layoutImage={layoutImage} 
            sdImage={sdImage} 
            loading={loading} 
          />
        </div>

        {/* Feedback Form */}
        {showFeedback && generationId && (
          <div className="mt-8">
            <FeedbackForm 
              generationId={generationId} 
              onFeedbackSubmitted={handleFeedbackSubmitted}
            />
          </div>
        )}
      </TabsContent>

      <TabsContent value="gallery">
        <BlueprintGallery />
      </TabsContent>
    </Tabs>
  )
}