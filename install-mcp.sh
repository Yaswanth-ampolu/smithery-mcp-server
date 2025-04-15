#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== MCP Terminal Server Installation ===${NC}"
echo "This script will install the MCP Terminal Server locally without root access"

# Installation directory in user's home
INSTALL_DIR="$HOME/mcp-terminal"
BIN_DIR="$HOME/bin"
VERSION="v1.0.0"
DOWNLOAD_URL="https://github.com/Yaswanth-ampolu/smithery-mcp-server/releases/download/$VERSION/mcp-terminal.tar.gz"
PID_FILE="$INSTALL_DIR/mcp.pid"
LOG_FILE="$INSTALL_DIR/mcp.log"

# Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$BIN_DIR"

# Download and extract
echo -e "${YELLOW}Downloading MCP Terminal Server...${NC}"
curl -L "$DOWNLOAD_URL" | tar xz -C "$INSTALL_DIR"

# Add bin directory to PATH if not already
if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
    echo -e "${YELLOW}Adding ~/bin to PATH in your bash profile...${NC}"
    echo 'export PATH="$HOME/bin:$PATH"' >> "$HOME/.bashrc"
    echo 'To use right away, run: export PATH="$HOME/bin:$PATH"'
fi

# Create the mcp-terminal command script
echo -e "${YELLOW}Creating mcp-terminal command...${NC}"
cat > "$BIN_DIR/mcp-terminal" << 'EOF'
#!/bin/bash

INSTALL_DIR="$HOME/mcp-terminal"
PID_FILE="$INSTALL_DIR/mcp.pid"
LOG_FILE="$INSTALL_DIR/mcp.log"

start_server() {
    if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null; then
        echo "MCP Terminal Server is already running! (PID: $(cat "$PID_FILE"))"
        return 1
    fi
    
    echo "Starting MCP Terminal Server..."
    cd "$INSTALL_DIR"
    nohup node dist/main.js > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    echo "Server started with PID: $(cat "$PID_FILE")"
    echo "Log file: $LOG_FILE"
    echo "You can access the server at: http://localhost:8080"
}

stop_server() {
    if [ ! -f "$PID_FILE" ]; then
        echo "No PID file found. Server may not be running."
        return 1
    fi
    
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null; then
        echo "Stopping MCP Terminal Server (PID: $PID)..."
        kill $PID
        rm "$PID_FILE"
        echo "Server stopped"
    else
        echo "Server is not running but PID file exists. Cleaning up..."
        rm "$PID_FILE"
    fi
}

status_server() {
    if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null; then
        echo "MCP Terminal Server is running (PID: $(cat "$PID_FILE"))"
        echo "Log file: $LOG_FILE"
        echo "Access URL: http://localhost:8080"
    else
        echo "MCP Terminal Server is not running"
        if [ -f "$PID_FILE" ]; then
            echo "Removing stale PID file..."
            rm "$PID_FILE"
        fi
    fi
}

case "$1" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        stop_server
        sleep 2
        start_server
        ;;
    status)
        status_server
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo "  start   - Start the MCP Terminal Server"
        echo "  stop    - Stop the running server"
        echo "  restart - Restart the server"
        echo "  status  - Check if the server is running"
        exit 1
        ;;
esac
EOF

# Make it executable
chmod +x "$BIN_DIR/mcp-terminal"

echo -e "${GREEN}MCP Terminal Server installed successfully!${NC}"
echo -e "${YELLOW}Usage:${NC}"
echo "  To start the server: mcp-terminal start"
echo "  To stop the server:  mcp-terminal stop"
echo "  To check status:     mcp-terminal status"
echo "  To restart server:   mcp-terminal restart"
echo ""
echo "The server will be available at: http://localhost:8080"
echo ""
echo -e "${YELLOW}Note:${NC} You may need to restart your terminal or run 'source ~/.bashrc'"
echo "to update your PATH before using the mcp-terminal command."

# Add ~/bin to the current PATH to allow immediate use
export PATH="$HOME/bin:$PATH"

# Ask if user wants to start the server now
read -p "Do you want to start the MCP Terminal Server now? (y/n): " START_SERVER
if [[ $START_SERVER =~ ^[Yy]$ ]]; then
    "$BIN_DIR/mcp-terminal" start
fi