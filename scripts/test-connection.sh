#!/bin/bash
# Script to test if the MCP server is accessible

# Get the server IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}')
PORT=8080

echo "Testing MCP server connection to http://$IP_ADDRESS:$PORT/sse"

# Test if the server is up and running
if curl -s -f -o /dev/null "http://$IP_ADDRESS:$PORT"; then
    echo "✓ Server is accessible at http://$IP_ADDRESS:$PORT"
else
    echo "✗ Cannot connect to server at http://$IP_ADDRESS:$PORT"
fi

# Test if the SSE endpoint is available
if curl -s -f -o /dev/null -H "Accept: text/event-stream" "http://$IP_ADDRESS:$PORT/sse"; then
    echo "✓ SSE endpoint is working at http://$IP_ADDRESS:$PORT/sse"
else
    echo "✗ SSE endpoint is not responding at http://$IP_ADDRESS:$PORT/sse"
fi

echo
echo "If both tests passed, configure Claude Desktop with:"
echo
echo '{
  "mcpServers": {
    "yaswanth-tools": {
      "url": "http://'"$IP_ADDRESS:$PORT"'/sse"
    }
  }
}' 