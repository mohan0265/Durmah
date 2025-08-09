FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/server ./apps/server

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8080

CMD ["node", "dist/index.js"]
