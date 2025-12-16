"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, ArrowLeft, Sparkles, Building2, ShieldCheck, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/useAuth"

type ResetStep = "email" | "password" | null

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resetStep, setResetStep] = useState<ResetStep>(null)
  const [resetEmail, setResetEmail] = useState("")
  const [resetPassword, setResetPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const router = useRouter()
  const { login } = useAuth()

  // Mostrar aviso si viene de un registro exitoso y asegurar scroll arriba
  useEffect(() => {
    if (typeof window === "undefined") return

    window.scrollTo({ top: 0, behavior: "smooth" })

    const flag = localStorage.getItem("archia_register_success")
    if (flag) {
      toast.success("Cuenta creada, inicia sesión para continuar")
      localStorage.removeItem("archia_register_success")
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(formData.email, formData.password)
      if (success) {
        router.push("/")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/check-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail }),
      })

      const data = await response.json()
      
      if (!data.exists) {
        toast.error("El correo electrónico no está registrado")
        return
      }

      setResetStep("password")
    } catch (error) {
      toast.error("Ocurrió un error al verificar el correo electrónico")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (resetPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: resetEmail,
          new_password: resetPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Error al restablecer la contraseña")
      }

      toast.success("Contraseña actualizada correctamente")
      setResetStep(null)
      setResetEmail("")
      setResetPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al restablecer la contraseña")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google/login`)
      const data = await response.json()
      window.location.href = data.url
    } catch (error) {
      toast.error("No se pudo iniciar el proceso de autenticación con Google")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-arch-grid opacity-20" />
      <div className="absolute inset-0 arch-gradient-overlay" />

      <div className="container mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center max-w-6xl relative z-10">
        {/* Panel informativo */}
        <div className="space-y-6 fade-in-up">
          <h1 className="text-4xl font-bold leading-tight">
            Inicia sesión y continúa tus <span className="text-primary">bocetos arquitectónicos</span>
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Accede a tu cuenta para seguir generando y refinando planos con IA. Tu biblioteca, favoritos y reseñas permanecen sincronizados.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/50 arch-shadow">
              <div className="mt-1">
                <Wand2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Itera con IA</p>
                <p className="text-sm text-muted-foreground">Genera variaciones de layouts en segundos.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/50 arch-shadow">
              <div className="mt-1">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Biblioteca segura</p>
                <p className="text-sm text-muted-foreground">Guarda planos y descárgalos cuando quieras.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/50 arch-shadow">
              <div className="mt-1">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Acceso protegido</p>
                <p className="text-sm text-muted-foreground">Autenticación segura y recuperación de contraseña.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/register">Crear cuenta</Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link href="/generator">Ir al generador</Link>
            </Button>
          </div>
        </div>

        {/* Panel de formulario */}
        <div className="flex justify-center fade-in-up" style={{ animationDelay: "0.1s" }}>
          <Card className="w-full max-w-[420px] arch-shadow border-border/50">
        <CardHeader>
          {resetStep ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="mb-2 -ml-2 w-fit"
                onClick={() => {
                  setResetStep(null)
                  setResetEmail("")
                  setResetPassword("")
                  setConfirmPassword("")
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              <CardTitle>
                {resetStep === "email" ? "Restablecer Contraseña" : "Nueva Contraseña"}
              </CardTitle>
              <CardDescription>
                {resetStep === "email"
                  ? "Ingresa tu correo electrónico para continuar"
                  : "Ingresa tu nueva contraseña"}
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle>Iniciar Sesión</CardTitle>
              <CardDescription>
                Ingresa tus credenciales para acceder a tu cuenta
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {!resetStep ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="text-xs px-0"
                    onClick={() => {
                      setResetStep("email")
                      setResetEmail(formData.email)
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</span>
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          ) : resetStep === "email" ? (
            <form onSubmit={handleResetEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Correo Electrónico</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</span>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Restablecer Contraseña"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        {!resetStep && (
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
              </div>
            </div>
            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
          </CardFooter>
        )}
      </Card>
        </div>
      </div>
    </div>
  )
}
