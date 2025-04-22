const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  const defaultHeaders: Record<string, string> = {  // Cambiar el tipo aquí
    "Content-Type": "application/json",
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  // Si la respuesta no es exitosa, lanzamos un error
  if (!response.ok) {
    const error = new Error("Error en la petición a la API")
    try {
      const data = await response.json()
      ;(error as any).info = data
      ;(error as any).status = response.status
    } catch (e) {
      ;(error as any).status = response.status
    }
    throw error
  }

  // Si la respuesta es exitosa, devolvemos los datos
  return response.json()
}