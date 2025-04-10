#!/bin/bash
# Script to start the MCP server

cd "$(dirname "$0")"

IP_ADDRESS=$(hostname -I | awk '{print $1}')
PORT=8080

echo "Starting MCP Server at $(date)"
echo "Server will be accessible at http://$IP_ADDRESS:$PORT"
echo ""
echo "To configure Claude Desktop, use this configuration in config.json:"
echo '{
  "mcpServers": {
    "yaswanth-tools": {
      "url": "http://'"$IP_ADDRESS:$PORT"'/sse",
      "command": "yaswanth-tools"
    }
  }
}'
echo ""

if [ "$1" == "dev" ]; then
    echo "Running in development mode..."
    pnpm dev
else
    echo "Running in production mode..."
    pnpm build && pnpm start
fi 