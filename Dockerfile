FROM node:20-alpine

WORKDIR /app

# Root deps provide the tsx runner for server/server.ts
COPY package*.json ./
RUN npm ci

# Backend deps
COPY server/package.json server/package-lock.json ./server/
RUN npm ci --prefix server

COPY . .

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npx", "tsx", "server/server.ts"]
