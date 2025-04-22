"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Download, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

interface Blueprint {
  id: string
  title: string
  url: string
  createdAt: string
  roomType: string
  squareMeters: number
}

export default function MyBlueprintsPage() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken")
      if (!token) {
        router.push("/login")
        return
      }

      fetchBlueprints(token)
    }

    checkAuth()
  }, [router])

  const fetchBlueprints = async (token: string) => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch("http://localhost:8000/blueprints/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("No se pudieron obtener los planos")
      }

      const data = await response.json()
      setBlueprints(data.blueprints || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : "Ocurrió un error al cargar los planos")

      // For demo purposes, add some placeholder data
      setBlueprints([
        {
          id: "1",
          title: "Apartamento Moderno",
          url: "/placeholder.svg?height=200&width=300",
          createdAt: "2023-04-15T10:30:00Z",
          roomType: "living-room",
          squareMeters: 75,
        },
        {
          id: "2",
          title: "Cocina Minimalista",
          url: "/placeholder.svg?height=200&width=300",
          createdAt: "2023-04-14T14:20:00Z",
          roomType: "kitchen",
          squareMeters: 25,
        },
        {
          id: "3",
          title: "Dormitorio Principal",
          url: "/placeholder.svg?height=200&width=300",
          createdAt: "2023-04-13T09:15:00Z",
          roomType: "bedroom",
          squareMeters: 30,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("authToken")

      // Replace with your actual API endpoint
      const response = await fetch(`http://localhost:8000/blueprints/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("No se pudo eliminar el plano")
      }

      // Remove the deleted blueprint from the state
      setBlueprints((prev) => prev.filter((blueprint) => blueprint.id !== id))

      toast({
        title: "Plano eliminado",
        description: "El plano ha sido eliminado correctamente",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al eliminar el plano",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Mis Planos</h1>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}

      {blueprints.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-6">Aún no has generado ningún plano</p>
          <Button asChild>
            <Link href="/generator">Crear Mi Primer Plano</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blueprints.map((blueprint) => (
            <Card key={blueprint.id} className="overflow-hidden">
              <CardContent className="p-0">
                <img
                  src={blueprint.url || "/placeholder.svg"}
                  alt={blueprint.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-medium mb-1">{blueprint.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">
                      {blueprint.roomType === "living-room"
                        ? "Sala de estar"
                        : blueprint.roomType === "kitchen"
                          ? "Cocina"
                          : blueprint.roomType === "bedroom"
                            ? "Dormitorio"
                            : blueprint.roomType}
                    </span>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">{blueprint.squareMeters} m²</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Creado el {new Date(blueprint.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex justify-between">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/generator?id=${blueprint.id}`}>Ver Detalles</Link>
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Descargar</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. El plano será eliminado permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(blueprint.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
