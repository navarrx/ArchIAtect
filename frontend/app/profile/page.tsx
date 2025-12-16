"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, User, Eye, EyeOff, Shield, Settings, Calendar, Mail, Lock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface UserData {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
  profile_picture_url: string | null
  google_id: string | null
  created_at: string
}

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [userData, setUserData] = useState<UserData>({
    id: 0,
    email: "",
    first_name: "",
    last_name: "",
    profile_picture_url: null,
    google_id: null,
    created_at: "",
  })
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken")
      if (!token) {
        router.push("/login")
        return
      }

      // Fetch user data
      fetchUserData(token)
    }

    checkAuth()

    // Asegurar scroll arriba al entrar en la página
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [router])

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("No se pudo obtener la información del usuario")
      }

      const data = await response.json()
      setUserData(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al cargar los datos del usuario",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: userData.first_name,
          last_name: userData.last_name,
        }),
      })

      if (!response.ok) {
        throw new Error("No se pudo actualizar la información del usuario")
      }

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido actualizada correctamente",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al actualizar los datos del usuario",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)

    try {
      if (passwordData.new_password !== passwordData.confirm_password) {
        throw new Error("Las contraseñas no coinciden")
      }

      const token = localStorage.getItem("authToken")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "No se pudo cambiar la contraseña")
      }

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente",
      })

      // Limpiar el formulario
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al cambiar la contraseña",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-arch-grid opacity-20" />
        <div className="absolute inset-0 arch-gradient-overlay" />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  const isGoogleUser = !!userData.google_id
  const fullName = `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || "Sin nombre"

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-arch-grid opacity-20" />
      <div className="absolute inset-0 arch-gradient-overlay" />
      {/* Header Section */}
      <section className="py-16 px-4 md:px-6 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
              </Link>
            </Button>
          </div>

          {/* Profile Header */}
          <div className="text-center mb-12 fade-in-up">
            <div className="relative inline-block mb-6">
              <Avatar className="h-32 w-32 border-4 border-background shadow-2xl">
                {userData.profile_picture_url ? (
                  <AvatarImage src={userData.profile_picture_url} alt={fullName} />
                ) : (
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/10 to-primary/20">
                    {fullName.split(" ").map(n => n[0]).join("").toUpperCase() || <User className="h-12 w-12" />}
                  </AvatarFallback>
                )}
              </Avatar>
              {isGoogleUser && (
                <div className="absolute -bottom-2 -right-2">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                    Google
                  </Badge>
                </div>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {fullName}
            </h1>
            
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Mail className="w-4 h-4" />
              <span>{userData.email}</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Miembro desde {new Date(userData.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-muted/50 p-1 rounded-2xl">
              <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Settings className="w-4 h-4 mr-2" />
                Perfil
              </TabsTrigger>
              {!isGoogleUser && (
                <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Seguridad
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile" className="mt-8">
              <Card className="border-0 shadow-xl bg-background/50 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Información Personal</CardTitle>
                  <CardDescription className="text-base">
                    {isGoogleUser
                      ? "Tu información está sincronizada con tu cuenta de Google"
                      : "Actualiza tu información personal"}
                  </CardDescription>
                </CardHeader>
                
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-6 px-8">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={userData.email}
                          disabled={true}
                          readOnly
                          className="bg-muted/50 border-0 rounded-xl px-4 py-3"
                        />
                        <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">El correo electrónico no se puede cambiar</p>
                    </div>

                    {!isGoogleUser && (
                      <>
                        <div className="space-y-3">
                          <Label htmlFor="first_name" className="text-sm font-medium">Nombre</Label>
                          <Input
                            id="first_name"
                            name="first_name"
                            value={userData.first_name || ""}
                            onChange={handleChange}
                            disabled={isSaving}
                            className="border-0 bg-muted/50 rounded-xl px-4 py-3 focus:bg-background focus:ring-2 focus:ring-primary/20"
                            placeholder="Tu nombre"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="last_name" className="text-sm font-medium">Apellido</Label>
                          <Input
                            id="last_name"
                            name="last_name"
                            value={userData.last_name || ""}
                            onChange={handleChange}
                            disabled={isSaving}
                            className="border-0 bg-muted/50 rounded-xl px-4 py-3 focus:bg-background focus:ring-2 focus:ring-primary/20"
                            placeholder="Tu apellido"
                          />
                        </div>
                      </>
                    )}

                    <Separator className="my-6" />

                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Cuenta creada: {new Date(userData.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                  
                  {!isGoogleUser && (
                    <CardFooter className="flex justify-center pb-8">
                      <Button 
                        type="submit" 
                        disabled={isSaving}
                        size="lg"
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Cambios
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  )}
                </form>
              </Card>
            </TabsContent>

            {!isGoogleUser && (
              <TabsContent value="security" className="mt-8">
                <Card className="border-0 shadow-xl bg-background/50 backdrop-blur-sm">
                  <CardHeader className="text-center pb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500/10 to-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Seguridad de la Cuenta</CardTitle>
                    <CardDescription className="text-base">
                      Actualiza tu contraseña para mantener tu cuenta segura
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="px-8">
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="current_password" className="text-sm font-medium">Contraseña Actual</Label>
                        <div className="relative">
                          <Input
                            id="current_password"
                            name="current_password"
                            type={showPassword.current ? "text" : "password"}
                            value={passwordData.current_password}
                            onChange={handlePasswordChange}
                            required
                            className="border-0 bg-muted/50 rounded-xl px-4 py-3 focus:bg-background focus:ring-2 focus:ring-primary/20 pr-12"
                            placeholder="Ingresa tu contraseña actual"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50 rounded-lg"
                            onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                          >
                            {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="new_password" className="text-sm font-medium">Nueva Contraseña</Label>
                        <div className="relative">
                          <Input
                            id="new_password"
                            name="new_password"
                            type={showPassword.new ? "text" : "password"}
                            value={passwordData.new_password}
                            onChange={handlePasswordChange}
                            required
                            className="border-0 bg-muted/50 rounded-xl px-4 py-3 focus:bg-background focus:ring-2 focus:ring-primary/20 pr-12"
                            placeholder="Ingresa tu nueva contraseña"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50 rounded-lg"
                            onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                          >
                            {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="confirm_password" className="text-sm font-medium">Confirmar Nueva Contraseña</Label>
                        <div className="relative">
                          <Input
                            id="confirm_password"
                            name="confirm_password"
                            type={showPassword.confirm ? "text" : "password"}
                            value={passwordData.confirm_password}
                            onChange={handlePasswordChange}
                            required
                            className="border-0 bg-muted/50 rounded-xl px-4 py-3 focus:bg-background focus:ring-2 focus:ring-primary/20 pr-12"
                            placeholder="Confirma tu nueva contraseña"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50 rounded-lg"
                            onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                          >
                            {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600" 
                        disabled={isChangingPassword}
                        size="lg"
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Actualizando...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Actualizar Contraseña
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </section>
    </div>
  )
}
