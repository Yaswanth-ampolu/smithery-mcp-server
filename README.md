# MCP Terminal Tools

A cross-platform Model Context Protocol (MCP) server for terminal access and system tools. This package allows AI assistants like Claude to interact with your local system.

## Features

- Run shell commands
- Execute Python scripts
- List directory contents
- Copy files
- Create files and directories
- Cross-platform support (Windows, macOS, Linux)
- Works with Claude Desktop and other MCP-compatible assistants

## Installation

### Global Installation (Recommended)

```bash
# Install globally via npm
npm install -g github:Yaswanth-ampolu/smithery-mcp-server

# Start the server
mcp-terminal
```

### Local Installation

```bash
# Clone the repository
git clone https://github.com/Yaswanth-ampolu/smithery-mcp-server.git
cd smithery-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## Configuring Claude Desktop

1. Open Claude Desktop
2. Go to Settings → Model Context Protocol
3. Add this configuration:

```json
{
  "mcpServers": {
    "terminal": {
      "url": "http://localhost:8080/sse",
      "command": "terminal"
    }
  }
}
```

4. Save and restart Claude Desktop
5. Test by asking Claude: "terminal ls" or "terminal echo hello"

## Environment Variables

Create a `.env` file to customize settings:

```
# Server settings
SERVER_NAME=MCP System Tools
SERVER_VERSION=1.0.0
PORT=8080

# Python interpreter path (will default to platform-appropriate value if not set)
PYTHON_PATH=

# Default workspace directory (will be auto-determined if not specified)
# DEFAULT_WORKSPACE=C:\path\to\workspace  # Windows
# DEFAULT_WORKSPACE=/path/to/workspace    # Mac/Linux

# Server binding
MCP_SERVER_HOST=0.0.0.0
MCP_SERVER_PORT=8080
```

## Available Tools

| Tool | Description |
|------|-------------|
| `runShellCommand` | Run a shell command and return its output |
| `runPythonFile` | Execute a Python script and return its output |
| `readDirectory` | List files and folders in a directory |
| `copyFile` | Copy a file from one location to another |
| `createFile` | Create a new file with the specified content |

## Workspace Directory

The server uses a workspace directory for file operations:

1. If `DEFAULT_WORKSPACE` is set in `.env`, that location is used
2. Otherwise, it looks for a `workspace` folder in the current directory
3. If not found, it creates an `mcp-workspace` folder on your Desktop
4. If Desktop isn't available, it creates it in your home directory

## License

MIT 