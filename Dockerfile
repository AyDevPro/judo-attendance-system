FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update   && apt-get install -y --no-install-recommends openssl ca-certificates libssl3   && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./
RUN if [ -f package-lock.json ]; then npm ci --ignore-scripts;     elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile;     elif [ -f yarn.lock ]; then yarn --frozen-lockfile;     else npm i; fi

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update   && apt-get install -y --no-install-recommends openssl ca-certificates libssl3   && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/src ./src
EXPOSE 3000
CMD ["npm", "start"]
