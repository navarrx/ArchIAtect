import { Suspense } from "react"
import BlueprintGenerator from "@/components/blueprint-generator"
import { Skeleton } from "@/components/ui/skeleton"

export default function GeneratorPage() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Generador de Planos</h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        Ajusta los parámetros a continuación para personalizar tu plano arquitectónico. Nuestra IA generará un boceto
        basado en tus especificaciones.
      </p>

      <Suspense fallback={<Skeleton className="w-full h-[600px] rounded-lg" />}>
        <BlueprintGenerator />
      </Suspense>
    </div>
  )
}
