FROM node:22-alpine AS base

WORKDIR /app

LABEL maintainer="nonolanlan1007"
LABEL org.opencontainers.image.title="BoardStack"
LABEL org.opencontainers.image.description="Open-source Trello alternative to manage your project, organize your tasks, note your ideas and much more!"
LABEL org.opencontainers.image.source="https://github.com/nonolanlan1007/boardstack"
LABEL org.opencontainers.image.vendor="nonolanlan1007"
LABEL org.opencontainers.image.licenses="MIT"

RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS build

COPY pnpm-*.yaml ./
COPY package.json ./

RUN pnpm install --frozen-lockfile

COPY . .

ENV NUXT_SESSION_PASSWORD="password"
ENV DATABASE_URL="dburl"
ENV ENABLE_REGISTRATION=true

RUN pnpm build --preset node-server

FROM base AS final

COPY pnpm-*.yaml ./
COPY package.json ./

RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/.output .output
COPY --from=build /app/prisma prisma

ENV ENABLE_REGISTRATION=true

CMD pnpm dlx prisma migrate deploy && node .output/server/index.mjs
