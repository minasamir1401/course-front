# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /app

# Add ARG to capture environment variable during build
ARG NEXT_PUBLIC_API_URL
ARG BACKEND_ORIGIN
ARG INTERNAL_BACKEND_URL
ARG NEXT_PUBLIC_BACKEND_ORIGIN
# Set it as ENV so Next.js build can see it
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV BACKEND_ORIGIN=$BACKEND_ORIGIN
ENV INTERNAL_BACKEND_URL=$INTERNAL_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_ORIGIN=$NEXT_PUBLIC_BACKEND_ORIGIN

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production

# Install PM2 globally
RUN npm install -g pm2

# Pass runtime environment variables needed by Next.js rewrites (next.config.ts)
ARG NEXT_PUBLIC_API_URL
ARG BACKEND_ORIGIN
ARG INTERNAL_BACKEND_URL
ARG NEXT_PUBLIC_BACKEND_ORIGIN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV BACKEND_ORIGIN=$BACKEND_ORIGIN
ENV INTERNAL_BACKEND_URL=$INTERNAL_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_ORIGIN=$NEXT_PUBLIC_BACKEND_ORIGIN

# Copy standalone output and static files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Set heap limit for Next.js to 512 MB per worker
ENV NODE_OPTIONS="--max-old-space-size=512"

# Start Next.js with PM2 (all cores) and memory limit
CMD ["pm2-runtime", "start", "server.js", "-i", "max", "--max-memory-restart", "512M"]
