"use client"

import React, { useState } from "react"
import { Star, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import axios from "axios"

interface FeedbackFormProps {
  generationId: number
  onFeedbackSubmitted?: () => void
}

const predefinedCriticisms = [
  "El diseño no es funcional",
  "Los espacios están mal distribuidos",
  "Falta de iluminación natural",
  "Circulación inadecuada",
  "No respeta las proporciones",
  "El estilo no es coherente",
  "Falta de privacidad en las habitaciones",
  "El baño está mal ubicado",
  "La cocina es muy pequeña",
  "No hay suficiente almacenamiento"
]

export default function FeedbackForm({ generationId, onFeedbackSubmitted }: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [selectedCriticisms, setSelectedCriticisms] = useState<string[]>([])
  const [customFeedback, setCustomFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleStarClick = (starRating: number) => {
    setRating(starRating)
  }

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating)
  }

  const handleStarLeave = () => {
    setHoveredRating(0)
  }

  const handleCriticismToggle = (criticism: string) => {
    setSelectedCriticisms(prev => 
      prev.includes(criticism)
        ? prev.filter(c => c !== criticism)
        : [...prev, criticism]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona una calificación",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const feedbackData = {
        generation_id: generationId,
        rating: rating,
        feedback: {
          selected_criticisms: selectedCriticisms,
          custom_feedback: customFeedback.trim() || null
        }
      }

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ratings/`, feedbackData)

      toast({
        title: "¡Gracias!",
        description: "Tu feedback ha sido enviado correctamente",
      })

      // Reset form
      setRating(0)
      setSelectedCriticisms([])
      setCustomFeedback("")

      // Call callback if provided
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted()
      }

    } catch (error: any) {
      console.error("Error submitting feedback:", error)
      
      let errorMessage = "Error al enviar el feedback"
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-xl font-semibold">
          ¿Qué opinas de este plano?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Stars */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Calificación general</Label>
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className="focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-400"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {rating === 0 && "Selecciona una calificación"}
              {rating === 1 && "Muy malo"}
              {rating === 2 && "Malo"}
              {rating === 3 && "Regular"}
              {rating === 4 && "Bueno"}
              {rating === 5 && "Excelente"}
            </p>
          </div>

          {/* Predefined Criticisms */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              ¿Qué aspectos podrían mejorarse? (opcional)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {predefinedCriticisms.map((criticism) => (
                <div key={criticism} className="flex items-center space-x-2">
                  <Checkbox
                    id={criticism}
                    checked={selectedCriticisms.includes(criticism)}
                    onCheckedChange={() => handleCriticismToggle(criticism)}
                  />
                  <Label
                    htmlFor={criticism}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {criticism}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Feedback */}
          <div className="space-y-3">
            <Label htmlFor="custom-feedback" className="text-sm font-medium">
              Comentarios adicionales (opcional)
            </Label>
            <Textarea
              id="custom-feedback"
              placeholder="Escribe aquí tus comentarios, sugerencias o críticas específicas..."
              value={customFeedback}
              onChange={(e) => setCustomFeedback(e.target.value)}
              className="resize-none border-0 bg-muted/50 rounded-xl p-4 focus:bg-background focus:ring-2 focus:ring-primary/20"
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Feedback
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 