# Claude Desktop Configuration Instructions

This guide provides step-by-step instructions to fix the "Could not load app settings" error and properly configure Claude Desktop to work with our MCP server.

## Step 1: Verify MCP Server is Running

Before configuring Claude Desktop, ensure your MCP server is running and accessible:

1. On the server machine (RHEL), start the MCP server:
   ```bash
   cd /home/yaswanth/Desktop/mcp-server
   ./start-mcp-server.sh
   ```

2. Confirm the server is accessible by visiting `http://172.16.16.54:8080` in a browser from the client machine.

## Step 2: Create the Correct Configuration File

1. **Find the correct directory**:
   - Windows: Navigate to `%APPDATA%\.claude\` (typically `C:\Users\<YourUsername>\AppData\Roaming\.claude\`)
   - macOS: `~/.claude/`
   - Linux: `~/.claude/`

2. **Create/edit the configuration file**:
   - The file MUST be named exactly `config.json` (not `claude_desktop_config.json` or `mcp.json`)
   - If the file already exists, open it for editing
   - If not, create a new text file named `config.json`

## Step 3: Use the Correct JSON Format

Copy and paste the following JSON contents exactly as shown:

```json
{
  "mcpServers": {
    "yaswanth-tools": {
      "url": "http://172.16.16.54:8080/sse",
      "command": "yaswanth-tools"
    }
  }
}
```

**Important Notes**:
- Make sure there are no extra spaces or characters
- The file must use UTF-8 encoding without BOM
- Both the `url` and `command` fields are required
- The `command` field can be the same as the server name

## Step 4: Run the Connectivity Test Script

For Windows users, download the `test-claude-connectivity.js` script and run it on the client machine to verify connectivity:

```bash
node test-claude-connectivity.js
```

This will test basic connectivity and the SSE endpoint to ensure Claude Desktop can communicate with the MCP server.

## Step 5: Restart Claude Desktop

1. **Close Claude Desktop completely**:
   - Exit the application (not just minimize)
   - Check your system tray and make sure it's not running in the background

2. **Start Claude Desktop again**

## Step 6: Verify Connection

1. Open a new chat in Claude Desktop
2. Type: "What tools do you have access to?"
3. Claude should mention the tools from our MCP server:
   - runShellCommand
   - runPythonFile
   - readDirectory
   - copyFile
   - createFile

## Troubleshooting

If you still see the error:

1. **Double-check the file name and location**:
   - Use File Explorer (Windows) or Finder (macOS) to confirm the file is in the correct location
   - Confirm the file is named exactly `config.json`

2. **Validate the JSON format**:
   - Use a tool like [JSONLint](https://jsonlint.com/) to validate your JSON
   - Copy-paste the contents to make sure there are no syntax errors

3. **Check server accessibility**:
   - Verify the server is running: `curl http://172.16.16.54:8080`
   - Check if the SSE endpoint is accessible: `curl -N http://172.16.16.54:8080/sse`

4. **Check firewall settings**:
   - Ensure port 8080 is open on the RHEL server
   - Make sure there are no network restrictions between your client and server

If all else fails, try removing Claude Desktop's cache directories before restarting. 