FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN pnpm build
RUN node scripts/prebuild-vercel.mjs

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV ALLOW_IN_MEMORY_PERSISTENCE=false

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

USER appuser

EXPOSE 3000

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
