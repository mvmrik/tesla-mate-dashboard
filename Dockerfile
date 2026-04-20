# ── Stage 1: build frontend ───────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install better-sqlite3 build deps
RUN apk add --no-cache python3 make g++

# Backend deps
COPY backend/package*.json ./
RUN npm install --omit=dev

# Backend source
COPY backend/src ./src

# Frontend build output → served as static files by express
COPY --from=frontend-build /app/frontend/dist ./public

# Static file serving middleware (add to index.js)
RUN npm install serve-static

# Data volume for SQLite
VOLUME ["/data"]

ENV PORT=3000
ENV DATA_DIR=/data
ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/index.js"]
