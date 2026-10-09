# syntax=docker/dockerfile:1

# ---- Stage 1: build the static bundle --------------------------------------
# Node is only needed to build. Nothing from this stage ships except /app/dist.
FROM node:22-alpine AS build
WORKDIR /app

# Copy the manifests first so the dependency layer is cached until they change;
# editing source code then rebuilds in seconds instead of reinstalling.
COPY package.json package-lock.json ./
RUN npm ci

# Vite inlines VITE_* variables into the bundle at BUILD time — they cannot be
# changed when the container starts. The default is a relative path because
# Nginx (below) serves the API on the same origin as the app.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# ---- Stage 2: serve it ------------------------------------------------------
# The unprivileged variant runs Nginx as a non-root user and listens on 8080
# (ports below 1024 need root).
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

ENV API_UPSTREAM=http://host.docker.internal:4000

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
