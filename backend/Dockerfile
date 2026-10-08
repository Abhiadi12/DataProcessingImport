# syntax=docker/dockerfile:1


# ---- Stage 1: compile TypeScript -------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Prisma's query engine links against OpenSSL, which Alpine does not ship.
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: runtime ------------------------------------------------------
# Only production dependencies + compiled JS. No compiler, no devDependencies.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# The generated Prisma client lives in node_modules/.prisma, which `npm ci
# --omit=dev` does not create — take it from the build stage.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY prisma ./prisma

USER node

CMD ["node", "dist/api/index.js"]
