# Etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

# Instalar forzando dependencias antiguas
RUN npm install --legacy-peer-deps

COPY . .

# Build-time env for Next.js - create .env.production for the build
# Using production URL directly (this is a public URL, not a secret)
RUN echo "NEXT_PUBLIC_API_URL=https://archiatect-backend-production.up.railway.app" > .env.production

RUN npm run build

# Etapa de producción
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar archivos necesarios desde la etapa de construcción
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
