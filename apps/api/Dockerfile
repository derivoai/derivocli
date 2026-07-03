# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy monorepo files
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN cd apps/api && pnpm run build

# Runtime stage
FROM node:22-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy from builder
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Set working directory to API
WORKDIR /app/apps/api

# Expose port (Railway will use PORT env var)
EXPOSE 3001

# Start the application
CMD ["node", "dist/index.js"]
