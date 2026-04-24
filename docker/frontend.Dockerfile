# Dev serwer Vite — proxy API do serwisu `backend` w sieci Compose
FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

RUN pnpm install --frozen-lockfile

ENV VITE_API_PROXY_TARGET=http://backend:3001
EXPOSE 5173
CMD ["pnpm", "--filter", "@pmdash/frontend", "exec", "vite", "--host", "0.0.0.0", "--port", "5173"]
