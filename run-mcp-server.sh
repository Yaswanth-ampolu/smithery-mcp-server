#!/bin/bash
# Full startup script for MCP server with all necessary setup

cd "$(dirname "$0")"

# Get IP address and port
IP_ADDRESS=$(hostname -I | awk '{print $1}')
PORT=8080

echo "====================================="
echo "     MCP Server Setup & Startup      "
echo "====================================="
echo

# Check if the port is already in use and kill the process if needed
if command -v lsof &> /dev/null; then
  echo "Checking if port $PORT is in use..."
  PID=$(lsof -i:$PORT -t)
  if [ ! -z "$PID" ]; then
    echo "Port $PORT is in use by process(es): $PID"
    echo "Killing process(es)..."
    for pid in $PID; do
      echo "  Killing process $pid..."
      kill -9 $pid
    done
    echo "✓ Process(es) killed. Port $PORT should now be available."
    sleep 1
  else
    echo "✓ Port $PORT is available."
  fi
else
  echo "! Cannot check if port is in use (lsof not found)."
  echo "  If the server fails to start, run 'sudo ./kill-port.sh' manually."
fi

# Check if firewall is running and port is open
if command -v firewall-cmd &> /dev/null; then
  echo "Checking firewall status..."
  if firewall-cmd --state &> /dev/null; then
    # Firewall is running, check if port is open
    if ! firewall-cmd --list-ports | grep -q "$PORT/tcp"; then
      echo "Port $PORT is not open in the firewall."
      echo "Run the following command to open it:"
      echo "  sudo ./open-firewall.sh"
      echo
    else
      echo "✓ Port $PORT is already open in the firewall."
    fi
  else
    echo "✓ Firewall is not running. No need to open ports."
  fi
else
  echo "✓ Firewall command not found. Assuming no firewall is running."
fi

# Build the project if needed
if [ ! -f "dist/main.js" ]; then
  echo "Building the project..."
  pnpm build
fi

# Print configuration information
echo
echo "====================================="
echo "         MCP SERVER CONFIG           "
echo "====================================="
echo "Server URL: http://$IP_ADDRESS:$PORT"
echo "SSE Endpoint: http://$IP_ADDRESS:$PORT/sse"
echo "Web Interface: http://$IP_ADDRESS:$PORT"
echo

# Print Claude Desktop configuration
echo "====================================="
echo "     CLAUDE DESKTOP CONFIG FILE      "
echo "====================================="
echo "File: ~/.claude/config.json or %APPDATA%\\.claude\\config.json"
echo
echo '{
  "mcpServers": {
    "yaswanth-tools": {
      "url": "http://'"$IP_ADDRESS:$PORT"'/sse",
      "command": "yaswanth-tools"
    }
  }
}'
echo
echo "====================================="
echo

# Ask user whether to run in dev or production mode
echo "How would you like to run the server?"
echo "1) Development mode (with auto-reload)"
echo "2) Production mode"
read -p "Enter your choice (1/2): " choice

case $choice in
  1)
    echo "Starting server in development mode..."
    pnpm dev
    ;;
  2)
    echo "Starting server in production mode..."
    pnpm start
    ;;
  *)
    echo "Invalid choice. Starting in production mode as default..."
    pnpm start
    ;;
esac 