import Link from "next/link"
import { ArrowRight, Building2, Cpu, Lightbulb, Ruler } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 md:px-6 text-center bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Diseño Arquitectónico Potenciado por IA
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Genera planos arquitectónicos profesionales en segundos con nuestra avanzada inteligencia artificial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/generator">
                Crear Plano
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/gallery">Ver Galería</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Características Principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
              <div className="p-3 rounded-full bg-primary/10 mb-4">
                <Cpu className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">IA Avanzada</h3>
              <p className="text-muted-foreground">
                Algoritmos de última generación que entienden los principios arquitectónicos.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
              <div className="p-3 rounded-full bg-primary/10 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">Múltiples Estilos</h3>
              <p className="text-muted-foreground">
                Desde moderno hasta tradicional, genera planos en diversos estilos arquitectónicos.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
              <div className="p-3 rounded-full bg-primary/10 mb-4">
                <Ruler className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">Personalizable</h3>
              <p className="text-muted-foreground">
                Ajusta parámetros como tamaño, complejidad y requisitos específicos.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
              <div className="p-3 rounded-full bg-primary/10 mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">Inspiración Instantánea</h3>
              <p className="text-muted-foreground">
                Obtén ideas y conceptos arquitectónicos en segundos para impulsar tu creatividad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Blueprints */}
      <section className="py-20 px-4 md:px-6 bg-muted">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Ejemplos de Planos</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Explora algunos de los planos generados por nuestra IA para inspirarte.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-lg border bg-card">
                <img
                  src={`/placeholder.svg?height=300&width=400`}
                  alt={`Ejemplo de plano ${i}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="font-medium mb-2">Plano de Ejemplo {i}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {i === 1
                      ? "Apartamento moderno de 75m²"
                      : i === 2
                        ? "Casa minimalista de 120m²"
                        : "Oficina de estilo industrial de 90m²"}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/generator">Ver Detalles</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link href="/generator">
                Crear Tu Propio Plano
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">¿Listo para Revolucionar tus Diseños?</h2>
          <p className="text-xl mb-8 opacity-90">
            Únete a miles de arquitectos y diseñadores que ya están utilizando nuestra plataforma.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">Comenzar Ahora</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
