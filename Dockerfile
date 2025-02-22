FROM node:22-alpine AS base

WORKDIR /app

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
