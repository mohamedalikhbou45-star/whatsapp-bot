# Small production image for the WhatsApp Bewerbungsbot
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install dependencies first so this layer is cached between builds
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY *.js ./

# Run as the unprivileged "node" user that ships with the image
USER node

ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- "http://localhost:${PORT}/health" || exit 1

CMD ["node", "index.js"]
