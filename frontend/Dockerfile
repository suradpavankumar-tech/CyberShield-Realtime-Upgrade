# =========================================================
# CyberShield 2.0 Frontend Dockerfile
# Multi-stage build: Node.js 22 builder + Nginx Alpine runner
# =========================================================

# Stage 1: Build React 19 + TypeScript + Vite app
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for efficient layer caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and build
COPY . .

# Set API base URL to relative /api/v1 so Nginx handles proxying automatically
ENV VITE_API_BASE_URL=/api/v1

# Build production bundle
RUN npm run build

# Stage 2: Serve with lightweight Nginx Alpine
FROM nginx:alpine

# Copy custom Nginx configuration template with dynamic PORT substitution for Railway
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Default PORT fallback if not provided by Railway
ENV PORT=80

# Copy production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
