FROM node:20-alpine

RUN npm install -g pnpm@8 --silent

WORKDIR /app

# Copie les manifestes workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY database/ ./database/

# Install toutes les dépendances
RUN pnpm install --frozen-lockfile

# Copie le code source
COPY apps/api/ ./apps/api/
COPY tsconfig.seed.json ./

# Génère le client Prisma et build l'API
RUN pnpm db:generate
RUN pnpm --filter api build

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
