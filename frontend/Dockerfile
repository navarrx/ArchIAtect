# Etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

# Build-time env for Next.js (needs to be set by Railway env vars)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Instalar forzando dependencias antiguas
RUN npm install --legacy-peer-deps

COPY . .

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
