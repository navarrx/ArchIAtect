import { Suspense } from "react"
import BlueprintGenerator from "@/components/blueprint-generator"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles, Building2 } from "lucide-react"

export default function GeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header Section - Apple Style */}
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-2xl">
                  <Building2 className="h-10 w-10 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Generador de Planos
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Ajusta los parámetros a continuación para personalizar tu plano arquitectónico. 
              <span className="text-foreground font-medium"> Nuestra IA generará un boceto basado en tus especificaciones.</span>
            </p>
          </div>

          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando generador...</p>
              </div>
            </div>
          }>
            <BlueprintGenerator />
          </Suspense>
        </div>
      </section>
    </div>
  )
}
