"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Users, Zap, AlertCircle, Clock, CheckCircle2, XCircle, KeyRound, Mail, BarChart3, TrendingUp, Activity, Shield, Star } from "lucide-react"
import axios from "axios"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface DashboardStats {
  total_users: number
  new_users_week: number
  total_generations: number
  success_rate: number
  pending_generations: number
  top_errors: { message: string; count: number }[]
  generations_by_day: { date: string; count: number }[]
  top_users: { id: number; email: string; name: string; count: number }[]
  latest_generations: {
    id: number
    prompt: string
    status: string
    created_at: string
    user: { email: string; name: string }
  }[]
  latest_users: {
    id: number
    email: string
    name: string
    created_at: string
    is_active: boolean
  }[]
  login_methods: { method: string; count: number }[]
  avg_rating: number
  rating_distribution: { [key: string]: number }
  top_feedbacks: { feedback: string; count: number }[]
  latest_feedbacks: { id: number; rating: number; text: string }[]
  percent_rated: number
}

const LOGIN_METHOD_COLORS = {
  'Google OAuth': '#4285F4', 
  'Email/Password': '#FF6B6B' 
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user?.is_superuser) {
        router.push("/")
        return
      }

      fetchStats()
    }
  }, [isLoading, isAuthenticated, user, router])

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/stats`)
      setStats(response.data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      case 'pending':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getLoginMethodIcon = (method: string) => {
    switch (method) {
      case 'Email/Password':
        return <Mail className="h-4 w-4 text-muted-foreground" />
      case 'Google OAuth':
        return <KeyRound className="h-4 w-4 text-muted-foreground" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-arch-grid opacity-20" />
      <div className="absolute inset-0 arch-gradient-overlay" />
      {/* Header Section */}
      <section className="py-16 px-4 md:px-6 relative z-10">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center arch-shadow-lg">
                  <BarChart3 className="h-10 w-10 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-background rounded-full flex items-center justify-center arch-shadow">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Dashboard
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Panel de administración con métricas y estadísticas en tiempo real
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
            <Card className="arch-shadow border-border/50 bg-card/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stats?.total_users || 0}</div>
                <p className="text-sm text-muted-foreground flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  +{stats?.new_users_week || 0} esta semana
                </p>
              </CardContent>
            </Card>

            <Card className="arch-shadow border-border/50 bg-card/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium">Total Generaciones</CardTitle>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stats?.total_generations || 0}</div>
                <p className="text-sm text-muted-foreground flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                  {stats?.success_rate || 0}% exitosas
                </p>
              </CardContent>
            </Card>

            <Card className="arch-shadow border-border/50 bg-card/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium">Errores Frecuentes</CardTitle>
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                {stats?.top_errors?.length ? (
                  <div className="space-y-3">
                    {stats.top_errors.slice(0, 3).map((error, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {error.message}
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {error.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No se han detectado errores</div>
                )}
              </CardContent>
            </Card>

            {/* Promedio de Rating */}
            <Card className="arch-shadow border-border/50 bg-card/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium">Promedio de Rating</CardTitle>
                <div className="w-12 h-12 bg-yellow-400/10 rounded-2xl flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2 flex items-center">
                  {stats?.avg_rating?.toFixed(2) || '0.00'}
                  <span className="ml-2 text-yellow-500">★</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats?.percent_rated || 0}% de planos calificados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            <Card className="md:col-span-2 arch-shadow border-border/50 bg-card/70">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Generaciones por Día</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {stats?.generations_by_day && stats.generations_by_day.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.generations_by_day || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => format(new Date(date), 'dd/MM', { locale: es })}
                          stroke="rgba(0,0,0,0.5)"
                        />
                        <YAxis stroke="rgba(0,0,0,0.5)" allowDecimals={false} />
                        <Tooltip 
                          labelFormatter={(date) => format(new Date(date), 'dd/MM/yyyy', { locale: es })}
                          contentStyle={{
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#8884d8" 
                          strokeWidth={3}
                          name="Generaciones"
                          dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Sin datos de generaciones para mostrar
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="arch-shadow border-border/50 bg-card/70">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500/10 to-green-500/20 rounded-xl flex items-center justify-center">
                    <KeyRound className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Métodos de Login</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.login_methods}
                        dataKey="count"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {stats?.login_methods.map((entry) => (
                          <Cell 
                            key={`cell-${entry.method}`} 
                            fill={LOGIN_METHOD_COLORS[entry.method as keyof typeof LOGIN_METHOD_COLORS]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-3 arch-shadow border-border/50 bg-card/70">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500/10 to-orange-500/20 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl">Top Usuarios</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.top_users}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis dataKey="name" stroke="rgba(0,0,0,0.5)" />
                      <YAxis stroke="rgba(0,0,0,0.5)" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Generaciones" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Latest Data Tables */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="arch-shadow border-border/50 bg-card/70">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-blue-500/20 rounded-xl flex items-center justify-center">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Últimas Generaciones</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl overflow-hidden border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold">Prompt</TableHead>
                        <TableHead className="font-semibold">Usuario</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.latest_generations.map((gen) => (
                        <TableRow key={gen.id} className="hover:bg-muted/20">
                          <TableCell className="max-w-[200px] truncate font-medium">
                            {gen.prompt}
                          </TableCell>
                          <TableCell>{gen.user.name}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(gen.status)} text-white`}>
                              {gen.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(gen.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="arch-shadow border-border/50 bg-card/70">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500/10 to-green-500/20 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Últimos Usuarios</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl overflow-hidden border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold">Nombre</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.latest_users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/20">
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: es })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de ratings y feedback */}
          <div className="grid gap-6 md:grid-cols-3 mb-12 mt-12">
            {/* Distribución de ratings */}
            <Card className="border-0 shadow-xl bg-background/50 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400/10 to-yellow-400/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-yellow-500" />
                  </div>
                  <CardTitle className="text-xl">Distribución de Ratings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(stats?.rating_distribution || {}).map(([rating, count]) => ({ rating, count }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis dataKey="rating" stroke="rgba(0,0,0,0.5)" />
                      <YAxis stroke="rgba(0,0,0,0.5)" allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FFD700" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            {/* Feedbacks más frecuentes */}
            <Card className="border-0 shadow-xl bg-background/50 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400/10 to-blue-400/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  </div>
                  <CardTitle className="text-xl">Feedbacks Más Frecuentes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(stats?.top_feedbacks?.length ? stats.top_feedbacks : [{ feedback: 'Sin datos', count: 0 }]).map((fb, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                      <span className="text-sm text-muted-foreground truncate max-w-[180px]">{fb.feedback}</span>
                      <Badge variant="secondary" className="ml-2">{fb.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Últimos feedbacks escritos */}
            <Card className="border-0 shadow-xl bg-background/50 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400/10 to-green-400/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                  </div>
                  <CardTitle className="text-xl">Últimos Feedbacks</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(stats?.latest_feedbacks?.length ? stats.latest_feedbacks : [{ id: 0, rating: 0, text: 'Sin feedbacks' }]).map((fb, idx) => (
                    <div key={fb.id || idx} className="p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center mb-1">
                        <span className="text-yellow-500 font-bold mr-2">{fb.rating}★</span>
                        <span className="text-sm text-muted-foreground">{fb.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
} 