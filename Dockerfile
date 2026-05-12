# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Add ARG to capture environment variable during build
ARG NEXT_PUBLIC_API_URL
ARG BACKEND_ORIGIN
# Set it as ENV so Next.js build can see it
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV BACKEND_ORIGIN=$BACKEND_ORIGIN

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output and static files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
