import { Suspense } from "react"
import BlueprintDiscover from "@/components/blueprint-discover"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Sparkles } from "lucide-react"

export default function DiscoverPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-7xl">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Search className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Sparkles className="h-3 w-3 text-purple-500" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Descubrir
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explora los planos arquitectónicos generados por nuestra IA. Encuentra inspiración y descubre ideas para tu próximo proyecto.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                <Skeleton className="w-full h-64" />
                <div className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <BlueprintDiscover />
      </Suspense>
    </div>
  )
}
