FROM node:24-bookworm-slim

WORKDIR /app
COPY package.json ./
COPY src ./src
COPY scripts ./scripts

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

VOLUME ["/var/lib/supermemory-github-bridge"]

CMD ["node", "src/server.mjs"]
