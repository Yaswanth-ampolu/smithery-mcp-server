FROM node:18-alpine

# Set working directory
WORKDIR /app

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

# Expose the server port
EXPOSE 8080

# Command to run the server
CMD ["node", "dist/main.js"] 