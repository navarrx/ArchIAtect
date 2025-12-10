"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth.tsx"

function GoogleCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { checkAuth } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      if (!code) {
        console.error("No code received from Google")
        router.push("/login")
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google/callback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        })

        if (!response.ok) {
          throw new Error("Failed to authenticate with Google")
        }

        const data = await response.json()
        
        // Store token and user data
        localStorage.setItem("authToken", data.access_token)
        localStorage.setItem("userData", JSON.stringify(data.user))

        // Update auth state
        await checkAuth()

        // Redirect to home
        router.push("/")
      } catch (error) {
        console.error("Google authentication error:", error)
        router.push("/login")
      }
    }

    handleCallback()
  }, [searchParams, router, checkAuth])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Autenticando con Google...</h1>
        <p className="text-muted-foreground">Por favor espera mientras completamos tu inicio de sesión.</p>
      </div>
    </div>
  )
}

export default function GoogleCallback() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Autenticando con Google...</h1>
          <p className="text-muted-foreground">Por favor espera mientras completamos tu inicio de sesión.</p>
        </div>
      </div>
    }>
      <GoogleCallbackInner />
    </Suspense>
  )
}