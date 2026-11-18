# Etapa 1: Compilação do TypeScript
FROM node:22-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Imagem final enxuta para rodar na VPS
FROM node:22-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

# Copia apenas o código JavaScript compilado da etapa anterior
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]