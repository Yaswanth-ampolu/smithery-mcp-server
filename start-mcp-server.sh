#!/bin/bash
# Script to start the MCP server

cd "$(dirname "$0")"

echo "Starting MCP Server at $(date)"
echo "Server will be accessible at http://$(hostname -I | awk '{print $1}'):8080"

if [ "$1" == "dev" ]; then
    echo "Running in development mode..."
    pnpm dev
else
    echo "Running in production mode..."
    pnpm build && pnpm start
fi 