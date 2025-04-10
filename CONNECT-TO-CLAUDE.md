# Connecting to Claude Desktop

This document explains how to connect our MCP server to Claude Desktop running on another machine.

## Prerequisites

1. The MCP server should be running on a machine accessible over the network.
2. Port 8080 should be open on the server's firewall.
3. Claude Desktop should be installed on the client machine.

## Steps to Connect

### 1. Start the MCP Server

On the server machine (this RHEL system):

```bash
# First time only: open the firewall
sudo ./open-firewall.sh

# Start the server
./start-mcp-server.sh
```

The server will start and display its IP address and port.

### 2. Test the Connection

Run the test connection script to verify the server is accessible:

```bash
./test-connection.sh
```

This will output whether the server is accessible and provide the configuration block needed for Claude Desktop.

### 3. Configure Claude Desktop

On the client machine where Claude Desktop is installed:

1. Locate the Claude Desktop configuration directory:
   - Windows: `%APPDATA%\.claude`
   - macOS: `~/.claude`
   - Linux: `~/.claude`

2. Create or edit the `config.json` file in this directory.

3. Add the following configuration (replace IP_ADDRESS with your actual server IP):

```json
{
  "mcpServers": {
    "yaswanth-tools": {
      "url": "http://172.16.16.54:8080/sse"
    }
  }
}
```

4. Save the file and restart Claude Desktop.

### 4. Verify Connection

1. After restarting Claude Desktop, open a new chat.
2. Type "What tools do you have access to?"
3. Claude should list the available tools from our MCP server:
   - runShellCommand
   - runPythonFile
   - readDirectory
   - copyFile
   - createFile

## Troubleshooting

If Claude doesn't discover the tools:

1. Check if the server is running: `curl http://172.16.16.54:8080`
2. Ensure the firewall allows connections: `sudo firewall-cmd --list-ports`
3. Verify the configuration in Claude's config.json file
4. Check Claude Desktop's logs for connection errors 