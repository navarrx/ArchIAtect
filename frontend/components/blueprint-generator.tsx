"use client"

import type React from "react"

import { useState } from "react"
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
import { fetchAPI } from "@/lib/api"

export default function BlueprintGenerator() {
  const [loading, setLoading] = useState(false)
  const [blueprint, setBlueprint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)

    try {
      const data = await fetchAPI("generate-blueprint", {
        method: "POST",
        body: JSON.stringify({
          roomType: formData.get("roomType"),
          squareMeters: formData.get("squareMeters"),
          style: formData.get("style"),
          additionalRequirements: formData.get("additionalRequirements"),
          complexity: formData.get("complexity"),
        }),
      })

      setBlueprint(data.blueprint_url) // Adjust based on your API response
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
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
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="roomType">Room Type</Label>
                  <Select name="roomType" defaultValue="living-room">
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="living-room">Living Room</SelectItem>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="bedroom">Bedroom</SelectItem>
                      <SelectItem value="bathroom">Bathroom</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="full-house">Full House</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="squareMeters">Size (m²)</Label>
                  <Input type="number" name="squareMeters" defaultValue="50" min="10" max="500" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">Architectural Style</Label>
                  <Select name="style" defaultValue="modern">
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                      <SelectItem value="traditional">Traditional</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="scandinavian">Scandinavian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complexity">Complexity</Label>
                  <div className="pt-2">
                    <Slider name="complexity" defaultValue={[50]} max={100} step={1} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Simple</span>
                      <span>Complex</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalRequirements">Additional Requirements</Label>
                  <Textarea
                    name="additionalRequirements"
                    placeholder="E.g., large windows, open kitchen, etc."
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Blueprint"
                  )}
                </Button>

                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
              </form>
            </CardContent>
          </Card>

          <BlueprintDisplay blueprint={blueprint} loading={loading} />
        </div>
      </TabsContent>

      <TabsContent value="gallery">
        <BlueprintGallery />
      </TabsContent>
    </Tabs>
  )
}
