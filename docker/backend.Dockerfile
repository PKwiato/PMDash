# Monorepo backend — produkcyjny start po `tsc`
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @pmdash/backend build

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "packages/backend/dist/index.js"]
