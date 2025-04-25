FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install basic dependencies
RUN apk add --no-cache python3 bash

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the TypeScript project
RUN npm run build

# Make CLI script executable
RUN chmod +x bin/cli.js

# Create workspace directory with proper permissions
RUN mkdir -p /tmp/mcp-workspace && chmod 777 /tmp/mcp-workspace
ENV DEFAULT_WORKSPACE=/tmp/mcp-workspace

# Command to run the server in stdio mode for Smithery
CMD ["node", "dist/smithery-adapter.js"]