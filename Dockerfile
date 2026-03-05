# ========================================
# Build Stage
# ========================================
FROM node:22-alpine AS builder

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./

# Install ALL dependencies (including dev) for potential build steps
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Copy application source
COPY . .

# ========================================
# Production Stage
# ========================================
FROM node:22-alpine AS production

# Install dumb-init and security updates
RUN apk add --no-cache \
    dumb-init \
    tini && \
    apk upgrade --no-cache

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/main.js ./
COPY --from=builder --chown=nodejs:nodejs /app/init.sql ./

# Create logs directory with proper permissions
RUN mkdir -p logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set environment to production
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=512" \
    PORT=3001

# Expose API port
EXPOSE 3001

# Health check for API
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run the application
CMD ["node", "main.js"]

