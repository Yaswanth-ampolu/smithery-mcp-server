FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    bash \
    git \
    curl \
    openssh-client

# Use non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy package files for dependency installation
COPY --chown=appuser:appgroup package.json pnpm-lock.yaml ./
COPY --chown=appuser:appgroup pnpm-workspace.yaml ./

# Install pnpm globally for the current user
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY --chown=appuser:appgroup . .

# Build the TypeScript project
RUN pnpm build

# Make CLI script executable
RUN chmod +x bin/cli.js

# Create workspace directory
RUN mkdir -p /home/appuser/mcp-workspace
ENV DEFAULT_WORKSPACE=/home/appuser/mcp-workspace

# Expose the server port
EXPOSE 8080

# Command to run the server
# For Smithery deployment (stdio mode):
# CMD ["node", "dist/smithery-adapter.js"]
# For standalone server:
CMD ["node", "dist/main.js"]