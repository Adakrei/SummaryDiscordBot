# Multi-stage build for NestJS Discord bot
FROM node:24-alpine AS builder
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Install dependencies first (better layer caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Prune to production dependencies only
RUN pnpm prune --prod

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/main.js"]
