FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS api
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY --from=frontend-build /app/server ./server
COPY --from=frontend-build /app/shared ./shared
COPY --from=frontend-build /app/tsconfig.server.json ./tsconfig.server.json
CMD ["npx", "tsx", "server/src/index.ts"]
