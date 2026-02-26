FROM node:20-slim

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application code
COPY src/ ./src/
COPY utils/ ./utils/
COPY content/ ./content/

# Non-root user for security
RUN addgroup --system pennyworth && adduser --system --ingroup pennyworth pennyworth
RUN mkdir -p /app/.cache && chown -R pennyworth:pennyworth /app
USER pennyworth

# Cloud Run uses PORT env var (default 8080)
ENV PORT=8080
ENV NODE_ENV=production
ENV TZ=Asia/Kolkata

EXPOSE 8080

CMD ["node", "src/app.js"]
