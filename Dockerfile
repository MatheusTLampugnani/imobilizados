# Multi-stage Dockerfile para o Sistema de Imobilizados Videplast

# Estágio 1: Build do Frontend (React + Vite)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# Estágio 2: Imagem Final de Execução (Node.js Express)
FROM node:20-alpine AS runner
WORKDIR /app

# Instala apenas dependências de produção do backend
COPY backend/package*.json ./backend/
RUN npm install --prefix backend --omit=dev

# Copia código do backend e o dist compilado do frontend
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "app.js"]
