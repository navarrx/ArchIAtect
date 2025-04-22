"use client"

import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface BlueprintDisplayProps {
  blueprint: string | null
  loading: boolean
}

export default function BlueprintDisplay({ blueprint, loading }: BlueprintDisplayProps) {
  return (
    <Card className="flex items-center justify-center min-h-[500px]">
      <CardContent className="p-6 w-full h-full flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-16 w-16 animate-spin mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Generating your blueprint...</p>
            <p className="text-xs text-muted-foreground mt-2">This may take a moment</p>
          </div>
        ) : blueprint ? (
          <img
            src={blueprint || "/placeholder.svg"}
            alt="Generated architectural blueprint"
            className="max-w-full max-h-[450px] object-contain"
          />
        ) : (
          <div className="text-center">
            <img
              src="/placeholder.svg?height=300&width=400"
              alt="Blueprint placeholder"
              className="mx-auto mb-4 opacity-20"
            />
            <p className="text-muted-foreground">Your generated blueprint will appear here</p>
            <p className="text-xs text-muted-foreground mt-2">Adjust parameters and click Generate</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
