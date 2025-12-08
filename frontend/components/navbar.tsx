"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X, User, Eye, EyeOff, Shield, Settings, Calendar, Mail, Lock, ArrowLeft, LogOut, Building2, Sparkles, BarChart3, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth.tsx"
import { useTheme } from "next-themes"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    window.location.href = "/login"
  }

  const navItems = [
    { name: "Inicio", href: "/" },
    { name: "Generador", href: "/generator" },
    { name: "Descubrir", href: "/discover" },
    ...(user?.is_superuser ? [{ name: "Dashboard", href: "/dashboard" }] : []),
  ]

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40 shadow-sm">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link href="/" className="group">
            <span className="font-bold text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
              ArchIAtect
            </span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center space-x-4 absolute left-1/2 transform -translate-x-1/2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-all duration-200 ${
                  pathname === item.href 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl hover:bg-muted/50 transition-all duration-200"
              aria-label="Cambiar tema"
            >
              {mounted ? (
                theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-2xl hover:bg-muted/50 transition-all duration-200 group"
                  >
                    <Avatar className="h-9 w-9 border-2 border-transparent group-hover:border-primary/20 transition-all duration-200">
                      <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-semibold">
                        {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl shadow-xl"
                >
                  <div className="p-2">
                    <div className="flex items-center space-x-2 p-2 rounded-xl bg-muted/30">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-semibold">
                          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || <User className="h-3 w-3" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user?.name || "Usuario"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem asChild className="rounded-xl mx-2 my-1 cursor-pointer">
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl mx-2 my-1 cursor-pointer">
                    <Link href="/my-blueprints" className="flex items-center">
                      <Building2 className="mr-2 h-4 w-4" />
                      Mis Planos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl mx-2 my-1 cursor-pointer">
                    <Link href="/favourites" className="flex items-center">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Mis Favoritos
                    </Link>
                  </DropdownMenuItem>
                  {user?.is_superuser && (
                    <DropdownMenuItem asChild className="rounded-xl mx-2 my-1 cursor-pointer">
                      <Link href="/dashboard" className="flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl mx-2 my-1 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  asChild 
                  className="rounded-xl hover:bg-muted/50 transition-all duration-200"
                >
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button 
                  asChild 
                  className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Link href="/register">Registrarse</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Navigation Toggle */}
          <button 
            className="md:hidden p-2 rounded-xl hover:bg-muted/50 transition-all duration-200" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-border/50 mt-4">
            <div className="flex flex-col space-y-2">
              {/* Theme Toggle Mobile */}
              <button
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark")
                }}
                className="px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 flex items-center"
              >
                {mounted ? (
                  theme === "dark" ? (
                    <>
                      <Sun className="mr-3 h-4 w-4" />
                      Tema Claro
                    </>
                  ) : (
                    <>
                      <Moon className="mr-3 h-4 w-4" />
                      Tema Oscuro
                    </>
                  )
                ) : (
                  <>
                    <Moon className="mr-3 h-4 w-4" />
                    Tema Oscuro
                  </>
                )}
              </button>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    pathname === item.href 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <div className="px-4 py-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-semibold">
                          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {user?.name || "Usuario"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href="/profile"
                    className="px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="mr-3 h-4 w-4" />
                    Mi Perfil
                  </Link>
                  <Link
                    href="/my-blueprints"
                    className="px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Building2 className="mr-3 h-4 w-4" />
                    Mis Planos
                  </Link>
                  <Link
                    href="/favourites"
                    className="px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Sparkles className="mr-3 h-4 w-4" />
                    Mis Favoritos
                  </Link>
                  {user?.is_superuser && (
                    <Link
                      href="/dashboard"
                      className="px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <BarChart3 className="mr-3 h-4 w-4" />
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="px-4 py-3 rounded-xl text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center w-full text-left"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-3 pt-2">
                  <Button 
                    variant="outline" 
                    asChild 
                    className="rounded-xl border-border/50 hover:bg-muted/50 transition-all duration-200"
                  >
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      Iniciar Sesión
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                      Registrarse
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
