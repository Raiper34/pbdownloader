# ─── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Build backend ───────────────────────────────────────────────────
FROM node:20-slim AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
RUN npm run build

# ─── Stage 3: All-in-one runtime image ────────────────────────────────────────
FROM node:20-slim

# Install Chromium, nginx, redis, supervisor and Puppeteer dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    nginx \
    redis-server \
    supervisor \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer – use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ── Backend ──
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY --from=backend-builder /app/backend/dist ./dist

RUN mkdir -p /app/data /app/downloads

# ── Frontend (nginx static files) ──
COPY --from=frontend-builder /app/frontend/dist/frontend/browser /usr/share/nginx/html

# ── nginx config ──
COPY nginx.all-in-one.conf /etc/nginx/conf.d/default.conf
RUN rm -f /etc/nginx/sites-enabled/default

# ── supervisord config ──
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Environment defaults (can be overridden at runtime)
ENV NODE_ENV=production
ENV REDIS_HOST=127.0.0.1
ENV REDIS_PORT=6379
ENV DB_PATH=/app/data/db.sqlite
ENV DOWNLOADS_PATH=/app/downloads
ENV PORT=3000

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
