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

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the TypeScript project
RUN pnpm build

# Make CLI script executable
RUN chmod +x bin/cli.js

# Create workspace directory
RUN mkdir -p /app/mcp-workspace && chmod 777 /app/mcp-workspace
ENV DEFAULT_WORKSPACE=/app/mcp-workspace

# Expose the server port (not needed for stdio mode but kept for standalone mode)
EXPOSE 8080

# Command to run the server in stdio mode for Smithery
CMD ["node", "dist/smithery-adapter.js"]