FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/admin ./apps/admin

RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/apps/admin/.next ./.next
COPY --from=builder /app/apps/admin/public ./public
COPY --from=builder /app/apps/admin/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
