# ─────────────────────────────────────────────────────
# Stage 1 — Builder: install deps & build the React app
# ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source and build
COPY . .
# VITE_API_URL will be baked in at build time (set via docker-compose build args)
ARG VITE_API_URL=http://localhost/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ─────────────────────────────────────────────────────
# Stage 2 — Runtime: serve with Nginx
# ─────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy the built React app from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
