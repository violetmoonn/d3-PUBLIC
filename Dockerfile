# Use official Node.js runtime as base image
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy source files
COPY . .

# Set environment for build
ENV NODE_ENV=production

# Build static frontend and bundle server
RUN npm run build

# Production runner stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package specifications
COPY package*.json ./

# Copy built artifacts and dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/EDIT_PRODUCT_DATA_HERE.ts ./EDIT_PRODUCT_DATA_HERE.ts

# Ensure public/uploads directory exists for static file uploads
RUN mkdir -p /app/public/uploads

# Expose container port
EXPOSE 3000

# Launch production server
CMD ["node", "dist/server.cjs"]
