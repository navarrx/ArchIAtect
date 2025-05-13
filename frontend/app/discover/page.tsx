import { Suspense } from "react"
import BlueprintDiscover from "@/components/blueprint-discover"
import { Skeleton } from "@/components/ui/skeleton"

export default function DiscoverPage() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Descubrir</h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        Explora los planos arquitectónicos generados por nuestra IA. Encuentra inspiración y descubre ideas para tu próximo proyecto.
      </p>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="w-full h-64 rounded-lg" />
            ))}
          </div>
        }
      >
        <BlueprintDiscover />
      </Suspense>
    </div>
  )
}
