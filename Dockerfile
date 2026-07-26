FROM node:20-alpine
WORKDIR /app

COPY server/package*.json ./server/
COPY .env* ./

WORKDIR /app/server
RUN npm ci

COPY server/ .

RUN mkdir -p uploads/doctors

EXPOSE 4000

CMD ["npx", "tsx", "server.ts"]
