#!/bin/bash

# Configuration
PORT=8080
WORKSPACE_DIR="$HOME/mcp-workspace"

# Create workspace directory if it doesn't exist
mkdir -p "$WORKSPACE_DIR"
echo "Using workspace directory: $WORKSPACE_DIR"

# Set environment variables
export DEFAULT_WORKSPACE="$WORKSPACE_DIR"
export SERVER_NAME="MCP System Tools"
export SERVER_VERSION="1.0.0"
export PORT="$PORT"

# Build the project if needed
if [ ! -d "dist" ] || [ ! -f "dist/main.js" ]; then
  echo "Building project..."
  npm run build
fi

# Start the server
echo "Starting MCP server on http://localhost:$PORT"
echo "Workspace directory: $WORKSPACE_DIR"
echo "Press Ctrl+C to stop the server"
node dist/main.js
