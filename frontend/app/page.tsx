"use client"

import Link from "next/link"
import { ArrowRight, Building2, Sparkles, Users, Zap, Eye, Download, CheckCircle, Plus, Clock, Star, TrendingUp, Calendar, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useEffect, useState } from "react"
import axios from "axios"

interface Blueprint {
  id: number
  prompt: string
  layout_image_url: string
  sd_image_url: string | null
  created_at: string
  status: string
}

interface UserStats {
  total_blueprints: number
  recent_blueprints: Blueprint[]
  favorite_blueprints: Blueprint[]
  recent_count: number
  success_rate: number
}

// Componente para usuarios NO logueados
function GuestHome() {
  const [publicStats, setPublicStats] = useState<{
    total_generations: number
    total_users: number
    success_rate: number
  } | null>(null)

  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/floorplans/stats/public`)
        if (response.ok) {
          const data = await response.json()
          setPublicStats(data)
        }
      } catch (error) {
        console.error('Error fetching public stats:', error)
      }
    }

    fetchPublicStats()
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Apple Style */}
      <section className="relative py-32 px-4 md:px-6 text-center bg-gradient-to-b from-background via-background to-muted/20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        
        <div className="relative container mx-auto max-w-5xl">
          <div className="mb-8">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Potenciado por IA
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            ArchIAtect
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Genera planos arquitectónicos profesionales en segundos. 
            <span className="text-foreground font-medium"> Diseño inteligente.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
              <Link href="/generator">
                Crear Plano
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto" asChild>
              <Link href="/discover">Explorar Galería</Link>
            </Button>
          </div>

          {/* Preview Image */}
          <div className="relative max-w-4xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-muted/50 to-muted rounded-2xl border border-border/50 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-24 h-24 text-muted-foreground/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Apple Style */}
      <section className="py-24 px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Diseño Arquitectónico
              <span className="text-primary"> Reimaginado</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Nuestra plataforma combina la creatividad humana con la potencia de la inteligencia artificial para crear planos únicos y funcionales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Generación Instantánea</h3>
              <p className="text-muted-foreground leading-relaxed">
                Describe tu visión y obtén planos arquitectónicos detallados en segundos. Nuestra IA entiende tus necesidades y las convierte en realidad.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Eye className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Galería Inspiradora</h3>
              <p className="text-muted-foreground leading-relaxed">
                Explora miles de planos generados por nuestra comunidad. Encuentra inspiración y descubre nuevas posibilidades para tus proyectos.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Comunidad Activa</h3>
              <p className="text-muted-foreground leading-relaxed">
                Únete a arquitectos, diseñadores y entusiastas que ya están transformando sus ideas en planos profesionales con ArchIAtect.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Cómo Funciona
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tres pasos simples para crear tu plano arquitectónico perfecto
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="text-2xl font-semibold mb-4">Describe tu Proyecto</h3>
              <p className="text-muted-foreground">
                Especifica el número de habitaciones, baños, cocina y otros espacios que necesitas. O simplemente describe tu visión en texto libre.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="text-2xl font-semibold mb-4">IA Genera tu Plano</h3>
              <p className="text-muted-foreground">
                Nuestra inteligencia artificial analiza tus especificaciones y crea un plano arquitectónico profesional optimizado para tus necesidades.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="text-2xl font-semibold mb-4">Descarga y Comparte</h3>
              <p className="text-muted-foreground">
                Descarga tu plano en alta calidad, guárdalo en tu biblioteca personal y compártelo con la comunidad para inspirar a otros.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Preview Section */}
      <section className="py-24 px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Explora la Galería
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Descubre planos increíbles generados por nuestra comunidad
          </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { title: "Apartamento Moderno", desc: "75m² con diseño minimalista", type: "Residencial" },
              { title: "Casa Familiar", desc: "120m² con jardín integrado", type: "Familiar" },
              { title: "Oficina Creativa", desc: "90m² estilo industrial", type: "Comercial" }
            ].map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 rounded-2xl border border-border/50 overflow-hidden mb-4 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-muted-foreground/40" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{item.desc}</p>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {item.type}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto" asChild>
              <Link href="/discover">
                Ver Más Planos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-4">
                {publicStats ? publicStats.total_generations.toLocaleString() : '...'}
              </div>
              <p className="text-xl text-muted-foreground">Planos Generados</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-4">
                {publicStats ? publicStats.total_users.toLocaleString() : '...'}
              </div>
              <p className="text-xl text-muted-foreground">Usuarios Registrados</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-4">
                {publicStats ? `${publicStats.success_rate}%` : '...'}
              </div>
              <p className="text-xl text-muted-foreground">Tasa de Éxito</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Apple Style */}
      <section className="py-32 px-4 md:px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Comienza a Crear Hoy
          </h2>
          <p className="text-xl md:text-2xl mb-12 opacity-90 leading-relaxed">
            Únete a la revolución del diseño arquitectónico. 
            <br />
            Tu próximo proyecto está a solo unos clics de distancia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 h-auto" asChild>
              <Link href="/register">Crear Cuenta Gratis</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/generator">Probar Ahora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 md:px-6 border-t bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4">ArchIAtect</h3>
              <p className="text-muted-foreground">
                Diseño arquitectónico potenciado por inteligencia artificial.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/generator" className="hover:text-foreground">Generador</Link></li>
                <li><Link href="/discover" className="hover:text-foreground">Galería</Link></li>
                <li><Link href="/my-blueprints" className="hover:text-foreground">Mis Planos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Cuenta</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground">Iniciar Sesión</Link></li>
                <li><Link href="/register" className="hover:text-foreground">Registrarse</Link></li>
                <li><Link href="/profile" className="hover:text-foreground">Mi Perfil</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Ayuda</a></li>
                <li><a href="#" className="hover:text-foreground">Contacto</a></li>
                <li><a href="#" className="hover:text-foreground">Privacidad</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 ArchIAtect. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Componente para usuarios logueados
function AuthenticatedHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>({})

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/floorplans/stats/user`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const userStats = response.data
        
        console.log('User stats from backend:', userStats)

        setStats({
          total_blueprints: userStats.total_blueprints,
          recent_blueprints: userStats.recent_blueprints || [],
          favorite_blueprints: userStats.recent_blueprints?.slice(0, 2) || [], // Simulando favoritos
          recent_count: userStats.recent_count,
          success_rate: userStats.success_rate
        })
        
        // Inicializar estado de loading para las imágenes
        const imageLoadingState: { [key: number]: boolean } = {}
        userStats.recent_blueprints?.forEach(blueprint => {
          if (blueprint.sd_image_url || blueprint.layout_image_url) {
            imageLoadingState[blueprint.id] = true
          }
        })
        setImageLoading(imageLoadingState)
      } catch (error) {
        console.error('Error fetching user stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserStats()
  }, [])

  const handleDownload = async (blueprint: Blueprint) => {
    try {
      const imageUrl = blueprint.sd_image_url || blueprint.layout_image_url
      if (!imageUrl) {
        alert('No hay imagen disponible para descargar')
        return
      }

      // Crear un enlace temporal para descargar
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `plano-${blueprint.id}-${new Date().getTime()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Error al descargar la imagen')
    }
  }

  const handleImageLoad = (blueprintId: number) => {
    setImageLoading(prev => ({ ...prev, [blueprintId]: false }))
  }

  const handleImageError = (blueprintId: number) => {
    setImageLoading(prev => ({ ...prev, [blueprintId]: false }))
  }

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Welcome Hero Section */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                ¡Hola, {user?.name || 'Arquitecto'}! 👋
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                ¿Listo para crear tu próximo plano arquitectónico?
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg px-6 py-3 h-auto" asChild>
                  <Link href="/generator">
                    <Plus className="mr-2 h-5 w-5" />
                    Crear Nuevo Plano
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-6 py-3 h-auto" asChild>
                  <Link href="/discover">Explorar Galería</Link>
                </Button>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-4 h-4 mr-2" />
                {stats?.total_blueprints || 0} planos creados
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Planos</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_blueprints || 0}</div>
                <p className="text-xs text-muted-foreground">
                  En tu biblioteca
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recientes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.recent_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Últimos 7 días
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.favorite_blueprints?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Guardados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.success_rate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Planos exitosos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Blueprints */}
      <section className="py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Tus Planos Recientes</h2>
            <Button variant="outline" asChild>
              <Link href="/my-blueprints">Ver Todos</Link>
            </Button>
          </div>

          {stats?.recent_blueprints && stats.recent_blueprints.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.recent_blueprints.map((blueprint) => (
                <Card key={blueprint.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
                  <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                    {blueprint.sd_image_url || blueprint.layout_image_url ? (
                      <>
                        {/* Loading state */}
                        {imageLoading[blueprint.id] !== false && (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        )}
                        
                        <img
                          src={blueprint.sd_image_url || blueprint.layout_image_url}
                          alt={blueprint.prompt}
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                            imageLoading[blueprint.id] !== false ? 'opacity-0' : 'opacity-100'
                          }`}
                          onLoad={() => handleImageLoad(blueprint.id)}
                          onError={() => handleImageError(blueprint.id)}
                        />
                      </>
                    ) : null}
                    
                    {/* Fallback icon - solo se muestra si no hay imagen o si falló la carga */}
                    <div className={`w-full h-full flex items-center justify-center ${
                      blueprint.sd_image_url || blueprint.layout_image_url ? 'hidden' : ''
                    }`}>
                      <Building2 className="w-16 h-16 text-muted-foreground/40" />
                    </div>
                    
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {blueprint.status}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{blueprint.prompt}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {new Date(blueprint.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/generator?prompt=${encodeURIComponent(blueprint.prompt)}`}>
                          Regenerar
                        </Link>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDownload(blueprint)}
                        disabled={!blueprint.sd_image_url && !blueprint.layout_image_url}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aún no tienes planos</h3>
              <p className="text-muted-foreground mb-6">
                Comienza creando tu primer plano arquitectónico
              </p>
              <Button asChild>
                <Link href="/generator">Crear Mi Primer Plano</Link>
          </Button>
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-8 text-center">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300" asChild>
              <Link href="/generator">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Crear Nuevo Plano</h3>
                  <p className="text-muted-foreground">
                    Genera un plano arquitectónico personalizado con IA
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300" asChild>
              <Link href="/discover">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Explorar Galería</h3>
                  <p className="text-muted-foreground">
                    Descubre planos inspiradores de la comunidad
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300" asChild>
              <Link href="/my-blueprints">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Mis Planos</h3>
                  <p className="text-muted-foreground">
                    Gestiona y organiza tu biblioteca de planos
                  </p>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Consejos para Mejores Resultados</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Aprovecha al máximo nuestra IA con estos consejos prácticos
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Sé Específico</h3>
              <p className="text-muted-foreground text-sm">
                Describe detalladamente el número de habitaciones, baños y espacios que necesitas para obtener resultados más precisos.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Experimenta</h3>
              <p className="text-muted-foreground text-sm">
                Prueba diferentes combinaciones de espacios y descripciones para descubrir nuevas posibilidades de diseño.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Inspírate</h3>
              <p className="text-muted-foreground text-sm">
                Explora la galería para ver ejemplos de otros usuarios y encontrar ideas para tus propios proyectos.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// Componente principal que detecta el estado de autenticación
export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return isAuthenticated ? <AuthenticatedHome /> : <GuestHome />
}
