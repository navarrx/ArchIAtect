import { Suspense } from "react"
import BlueprintDiscover from "@/components/blueprint-discover"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Sparkles } from "lucide-react"

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 relative overflow-hidden">
      {/* Architectural Background Patterns */}
      <div className="absolute inset-0 bg-arch-grid opacity-20" />
      <div className="absolute inset-0 arch-gradient-overlay" />
      
      <div className="container mx-auto py-12 px-4 md:px-6 max-w-7xl relative z-10">
        {/* Header Section - Architectural Style */}
        <div className="text-center mb-12 fade-in-up">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center arch-shadow-lg">
                <Search className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-background rounded-full flex items-center justify-center arch-shadow">
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent fade-in-up" style={{ animationDelay: '0.1s' }}>
            Descubrir
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto fade-in-up" style={{ animationDelay: '0.2s' }}>
            Explora los planos arquitectónicos generados por nuestra IA. Encuentra inspiración y descubre ideas para tu próximo proyecto.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm arch-shadow">
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
    </div>
  )
}
