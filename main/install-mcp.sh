#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default settings
INSTALL_DIR="$HOME/mcp-terminal"
BIN_DIR="$HOME/bin"
VERSION="v1.0.0"  # Change this when releasing new versions
REPO_NAME="smithery-mcp"
GITHUB_USER="Yaswanth-ampolu"
DOWNLOAD_URL="https://github.com/$GITHUB_USER/$REPO_NAME/releases/download/$VERSION/mcp-terminal.tar.gz"
PID_FILE="$INSTALL_DIR/mcp.pid"
LOG_FILE="$INSTALL_DIR/mcp.log"
PORT=8080

# Function to check dependencies
check_dependencies() {
  echo -e "${YELLOW}Checking dependencies...${NC}"
  
  # Check for Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed!${NC}"
    echo "Please install Node.js (version 14 or higher) before continuing."
    echo "Visit: https://nodejs.org/en/download/"
    exit 1
  fi
  
  # Check node version (need 14+)
  NODE_VERSION=$(node -v | cut -d 'v' -f 2)
  NODE_MAJOR=$(echo $NODE_VERSION | cut -d '.' -f 1)
  if [ "$NODE_MAJOR" -lt 14 ]; then
    echo -e "${RED}Error: Node.js version 14 or higher is required!${NC}"
    echo "Current version: $NODE_VERSION"
    echo "Please upgrade Node.js before continuing."
    exit 1
  fi
  
  # Check for curl
  if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed!${NC}"
    echo "Please install curl before continuing."
    exit 1
  fi
  
  # Check for tar
  if ! command -v tar &> /dev/null; then
    echo -e "${RED}Error: tar is not installed!${NC}"
    echo "Please install tar before continuing."
    exit 1
  fi
  
  echo -e "${GREEN}All dependencies are satisfied!${NC}"
}

# Function to add bin directory to PATH in the appropriate shell config file
setup_path() {
  # Detect shell
  SHELL_NAME=$(basename "$SHELL")
  
  # Check if ~/bin is already in PATH
  if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
    echo -e "${YELLOW}Adding ~/bin to PATH in your shell profile...${NC}"
    
    # Check which shell config file to use
    if [ "$SHELL_NAME" = "bash" ]; then
      if [ -f "$HOME/.bashrc" ]; then
        SHELL_CONFIG="$HOME/.bashrc"
      elif [ -f "$HOME/.bash_profile" ]; then
        SHELL_CONFIG="$HOME/.bash_profile"
      else
        SHELL_CONFIG="$HOME/.bashrc"
        touch "$SHELL_CONFIG"
      fi
    elif [ "$SHELL_NAME" = "zsh" ]; then
      SHELL_CONFIG="$HOME/.zshrc"
      touch "$SHELL_CONFIG" 2>/dev/null || true
    else
      # Default to .profile for other shells
      SHELL_CONFIG="$HOME/.profile"
      touch "$SHELL_CONFIG" 2>/dev/null || true
    fi
    
    # Add PATH to shell config
    echo 'export PATH="$HOME/bin:$PATH"' >> "$SHELL_CONFIG"
    echo -e "${GREEN}Added ~/bin to PATH in ${SHELL_CONFIG}${NC}"
    echo -e "To use right away, run: ${BLUE}export PATH=\"\$HOME/bin:\$PATH\"${NC}"
  else
    echo -e "${GREEN}~/bin is already in your PATH!${NC}"
  fi
}

# Function to install the MCP Terminal Server
install_mcp() {
  echo -e "${YELLOW}=== MCP Terminal Server Installation ===${NC}"
  echo "This script will install the MCP Terminal Server locally without root access"
  
  # Create directories
  mkdir -p "$INSTALL_DIR" || { echo -e "${RED}Failed to create installation directory!${NC}"; exit 1; }
  mkdir -p "$BIN_DIR" || { echo -e "${RED}Failed to create bin directory!${NC}"; exit 1; }
  
  # Download and extract
  echo -e "${YELLOW}Downloading MCP Terminal Server...${NC}"
  if ! curl -L "$DOWNLOAD_URL" -o /tmp/mcp-terminal.tar.gz; then
    echo -e "${RED}Download failed! Please check your internet connection and try again.${NC}"
    echo "URL: $DOWNLOAD_URL"
    exit 1
  fi
  
  echo -e "${YELLOW}Extracting files...${NC}"
  if ! tar xzf /tmp/mcp-terminal.tar.gz -C "$INSTALL_DIR"; then
    echo -e "${RED}Extraction failed!${NC}"
    rm -f /tmp/mcp-terminal.tar.gz
    exit 1
  fi
  
  # Clean up
  rm -f /tmp/mcp-terminal.tar.gz
  
  # Create the mcp-terminal command script
  echo -e "${YELLOW}Creating mcp-terminal command...${NC}"
  cat > "$BIN_DIR/mcp-terminal" << 'EOF'
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

INSTALL_DIR="$HOME/mcp-terminal"
PID_FILE="$INSTALL_DIR/mcp.pid"
LOG_FILE="$INSTALL_DIR/mcp.log"
PORT=8080  # Default port, can be changed with --port option

# Parse command line options
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --port)
      PORT="$2"
      shift 2
      ;;
    *)
      # Save the first non-option argument as the command
      if [ -z "$COMMAND" ]; then
        COMMAND="$1"
        shift
      else
        echo "Unknown parameter: $1"
        exit 1
      fi
      ;;
  esac
done

start_server() {
  if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE" 2>/dev/null) > /dev/null 2>&1; then
    echo -e "${YELLOW}MCP Terminal Server is already running! (PID: $(cat "$PID_FILE"))${NC}"
    return 1
  fi
  
  echo -e "${GREEN}Starting MCP Terminal Server on port $PORT...${NC}"
  cd "$INSTALL_DIR" || { echo -e "${RED}Failed to change to installation directory!${NC}"; exit 1; }
  
  # Check if dist/main.js exists
  if [ ! -f "dist/main.js" ]; then
    echo -e "${RED}Error: dist/main.js not found in installation directory!${NC}"
    echo "The installation may be corrupted. Try reinstalling the MCP Terminal Server."
    exit 1
  fi
  
  # Create public directory and index.html if they don't exist
  if [ ! -d "public" ]; then
    mkdir -p public
  fi

  if [ ! -f "public/index.html" ]; then
    cat > "public/index.html" << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
  <title>MCP Terminal Server</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .tools { background: #f5f5f5; padding: 20px; border-radius: 5px; }
    .tool { margin-bottom: 15px; }
    .tool h3 { margin-bottom: 5px; }
    button { background: #4CAF50; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 3px; }
    pre { background: #f1f1f1; padding: 10px; border-radius: 3px; overflow: auto; }
    #output { margin-top: 20px; border: 1px solid #ddd; padding: 10px; min-height: 100px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>MCP Terminal Server</h1>
    <p>This server provides terminal access and system tools via the Model Context Protocol (MCP).</p>
    
    <div class="tools">
      <h2>Available Tools:</h2>
      
      <div class="tool">
        <h3>Run Shell Command</h3>
        <p>Execute a shell command on the server.</p>
        <input type="text" id="commandInput" placeholder="Enter command (e.g., ls -la)" style="width:60%; padding:5px;">
        <button onclick="runCommand()">Execute</button>
      </div>
      
      <div class="tool">
        <h3>List Directory</h3>
        <p>List files in a directory.</p>
        <input type="text" id="dirInput" placeholder="Enter directory path (leave empty for workspace root)" style="width:60%; padding:5px;">
        <button onclick="listDirectory()">List</button>
      </div>
    </div>
    
    <h2>Output:</h2>
    <pre id="output">Results will appear here...</pre>
  </div>

  <script>
    function runCommand() {
      const command = document.getElementById('commandInput').value;
      if (!command) return;
      
      fetch('/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'web-' + Date.now(),
          type: 'invoke_tool',
          content: {
            name: 'runShellCommand',
            parameters: { command }
          },
          clientId: 'web-client'
        }),
      })
      .then(response => response.json())
      .then(data => {
        const output = document.getElementById('output');
        if (data.content && data.content.content) {
          output.textContent = data.content.content[0].text;
        } else {
          output.textContent = 'Error: Unexpected response format';
        }
      })
      .catch(error => {
        document.getElementById('output').textContent = 'Error: ' + error.message;
      });
    }
    
    function listDirectory() {
      const dirPath = document.getElementById('dirInput').value;
      
      fetch('/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'web-' + Date.now(),
          type: 'invoke_tool',
          content: {
            name: 'readDirectory',
            parameters: { dirPath }
          },
          clientId: 'web-client'
        }),
      })
      .then(response => response.json())
      .then(data => {
        const output = document.getElementById('output');
        if (data.content && data.content.content) {
          output.textContent = data.content.content[0].text;
        } else {
          output.textContent = 'Error: Unexpected response format';
        }
      })
      .catch(error => {
        document.getElementById('output').textContent = 'Error: ' + error.message;
      });
    }
    
    // Connect to SSE endpoint
    const eventSource = new EventSource('/sse');
    eventSource.onmessage = function(event) {
      console.log('SSE message:', event.data);
    };
    eventSource.onerror = function() {
      console.error('SSE connection error');
    };
  </script>
</body>
</html>
HTMLEOF
  fi
  
  # Start the server with the specified port
  PORT=$PORT nohup node dist/main.js > "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
  
  # Check if the server started successfully
  sleep 2
  if ps -p $(cat "$PID_FILE" 2>/dev/null) > /dev/null 2>&1; then
    echo -e "${GREEN}Server started with PID: $(cat "$PID_FILE")${NC}"
    echo "Log file: $LOG_FILE"
    echo -e "You can access the server at: ${BLUE}http://localhost:$PORT${NC}"
  else
    echo -e "${RED}Server failed to start. Check the log file for details:${NC}"
    echo "tail -n 20 $LOG_FILE"
    rm -f "$PID_FILE"
    return 1
  fi
}

stop_server() {
  if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}No PID file found. Server may not be running.${NC}"
    return 1
  fi
  
  PID=$(cat "$PID_FILE" 2>/dev/null)
  if [ -z "$PID" ]; then
    echo -e "${RED}Invalid PID file. Cleaning up...${NC}"
    rm -f "$PID_FILE"
    return 1
  fi
  
  if ps -p $PID > /dev/null 2>&1; then
    echo -e "${YELLOW}Stopping MCP Terminal Server (PID: $PID)...${NC}"
    kill $PID
    
    # Wait for the server to shut down
    for i in {1..5}; do
      if ! ps -p $PID > /dev/null 2>&1; then
        break
      fi
      sleep 1
    done
    
    # Force kill if still running
    if ps -p $PID > /dev/null 2>&1; then
      echo -e "${YELLOW}Server not responding. Forcing shutdown...${NC}"
      kill -9 $PID
    fi
    
    rm -f "$PID_FILE"
    echo -e "${GREEN}Server stopped${NC}"
  else
    echo -e "${YELLOW}Server is not running but PID file exists. Cleaning up...${NC}"
    rm -f "$PID_FILE"
  fi
}

status_server() {
  if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE" 2>/dev/null) > /dev/null 2>&1; then
    echo -e "${GREEN}MCP Terminal Server is running (PID: $(cat "$PID_FILE"))${NC}"
    echo "Log file: $LOG_FILE"
    
    # Try to determine the actual port used by the server
    SERVER_PORT=$(grep -o "Listening on port [0-9]*" "$LOG_FILE" | tail -1 | awk '{print $4}')
    if [ -z "$SERVER_PORT" ]; then
      SERVER_PORT=$PORT
    fi
    
    echo -e "Access URL: ${BLUE}http://localhost:$SERVER_PORT${NC}"
    
    # Show memory usage
    MEM_USAGE=$(ps -o rss= -p $(cat "$PID_FILE"))
    if [ ! -z "$MEM_USAGE" ]; then
      echo "Memory usage: $(($MEM_USAGE / 1024)) MB"
    fi
  else
    echo -e "${YELLOW}MCP Terminal Server is not running${NC}"
    if [ -f "$PID_FILE" ]; then
      echo "Removing stale PID file..."
      rm -f "$PID_FILE"
    fi
  fi
}

uninstall_server() {
  echo -e "${YELLOW}Uninstalling MCP Terminal Server...${NC}"
  
  # Stop the server if it's running
  if [ -f "$PID_FILE" ]; then
    stop_server
  fi
  
  # Remove the command script
  if [ -f "$BIN_DIR/mcp-terminal" ]; then
    rm -f "$BIN_DIR/mcp-terminal"
    echo "Removed command script"
  fi
  
  # Remove the installation directory
  if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    echo "Removed installation directory"
  fi
  
  echo -e "${GREEN}MCP Terminal Server has been uninstalled!${NC}"
  echo "Note: The PATH modification in your shell configuration remains."
}

# Process command if passed directly to the script
if [ -z "$COMMAND" ] && [ ! -z "$1" ]; then
  COMMAND="$1"
  shift
fi

case "$COMMAND" in
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
  uninstall)
    uninstall_server
    ;;
  *)
    echo -e "${YELLOW}Usage: $0 {start|stop|restart|status|uninstall} [--port PORT]${NC}"
    echo "  start     - Start the MCP Terminal Server"
    echo "  stop      - Stop the running server"
    echo "  restart   - Restart the server"
    echo "  status    - Check if the server is running"
    echo "  uninstall - Remove MCP Terminal Server from your system"
    echo ""
    echo "Options:"
    echo "  --port PORT  - Specify which port to use (default: 8080)"
    exit 1
    ;;
esac
EOF

# Make it executable
chmod +x "$BIN_DIR/mcp-terminal"
if [ ! -x "$BIN_DIR/mcp-terminal" ]; then
  echo -e "${RED}Failed to make mcp-terminal executable!${NC}"
  exit 1
fi

# Add executable permission for the install directory
chmod -R +x "$INSTALL_DIR"

# Setup PATH
setup_path

echo -e "${GREEN}MCP Terminal Server installed successfully!${NC}"
echo -e "${YELLOW}Usage:${NC}"
echo -e "  To start the server:    ${BLUE}mcp-terminal start${NC}"
echo -e "  To stop the server:     ${BLUE}mcp-terminal stop${NC}"
echo -e "  To check status:        ${BLUE}mcp-terminal status${NC}"
echo -e "  To restart server:      ${BLUE}mcp-terminal restart${NC}"
echo -e "  To uninstall:           ${BLUE}mcp-terminal uninstall${NC}"
echo -e "  To use a different port:${BLUE}mcp-terminal start --port 9000${NC}"
echo ""
echo -e "The server will be available at: ${BLUE}http://localhost:8080${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} You may need to restart your terminal or run 'source ~/.bashrc'"
echo "to update your PATH before using the mcp-terminal command."

# Add ~/bin to the current PATH to allow immediate use
export PATH="$HOME/bin:$PATH"

# Ask if user wants to start the server now
read -p "Do you want to start the MCP Terminal Server now? [y/N]: " START_SERVER
if [[ $START_SERVER =~ ^[Yy]$ ]]; then
  "$BIN_DIR/mcp-terminal" start
fi