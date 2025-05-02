# Local MCP Server Setup for Claude

This guide explains how to set up the MCP server locally so that Claude can access your local system through the MCP tools.

## Prerequisites

- Node.js 18 or later
- npm
- Python 3 (for Python script execution)
- Bash shell

## Setup Instructions

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/terminal-commands-vlsi.git
   cd terminal-commands-vlsi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local server:
   ```bash
   ./start-local-server.sh
   ```

   This will:
   - Create a workspace directory at `~/mcp-workspace`
   - Build the project if needed
   - Start the MCP server on port 8080

4. The server will be available at: `http://localhost:8080`

5. To stop the server, press `Ctrl+C` in the terminal where it's running.

## Using with Claude

To use the local MCP server with Claude, you need to:

1. Ensure the server is running locally
2. Make sure Claude has access to your local network (through Anthropic's API or Claude Pro)
3. Tell Claude to use the MCP server at `http://localhost:8080`

Example prompt for Claude:

```
I have an MCP server running locally at http://localhost:8080. Please use this server to access my local system and help me with [your task].
```

## Available Tools

The MCP server provides the following tools:

1. `runShellCommand` - Execute shell commands
2. `runPythonFile` - Run Python scripts
3. `readDirectory` - List files in a directory
4. `copyFile` - Copy files
5. `createFile` - Create new files
6. `readFile` - Read file contents
7. `editFile` - Edit existing files
8. `deleteFile` - Delete files
9. `moveFile` - Move/rename files
10. `createDirectory` - Create directories
11. `moveDirectory` - Move/rename directories
12. `copyDirectory` - Copy directories
13. `deleteDirectory` - Delete directories
14. `getDirectoryTree` - Get a hierarchical view of directories
15. `grep` - Search for patterns in files
16. `combinationTask` - Run multiple operations with a common working directory

## Troubleshooting

- If you get a "port already in use" error, you can change the port in the `start-local-server.sh` script.
- Make sure your firewall allows connections to the port you're using.
- If Claude can't connect to your local server, you may need to use a service like ngrok to expose your local server to the internet.
