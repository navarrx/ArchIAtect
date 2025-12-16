import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import { Toaster } from "sonner"
import { AuthProvider } from "@/hooks/useAuth.tsx"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ArchIAtect",
  description: "Generate architectural blueprint sketches using artificial intelligence",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <Navbar />
            <main className={inter.className}>{children}</main>
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'