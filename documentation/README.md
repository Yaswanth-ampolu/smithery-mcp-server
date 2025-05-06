# MCP Server Documentation

Welcome to the MCP (Model Context Protocol) Server documentation. This repository contains comprehensive guides and technical documentation for understanding, using, and integrating with the MCP server.

## Overview

The MCP server provides a standardized way for AI applications to interact with system resources through a set of predefined tools. It enables AI models to execute commands, access files, and perform other system operations in a controlled and secure manner.

## Documentation Structure

This documentation is organized into several guides, each focusing on a specific aspect of the MCP server:

1. [**MCP Integration Guide**](mcp-integration-guide.md) - Explains how the MCP server works and how clients can integrate with it, focusing on session management, client connections, and tool invocation.

2. [**AI Integration Guide**](ai-integration-guide.md) - Provides practical guidance on integrating AI applications with the MCP server, including implementation patterns and best practices.

3. [**MCP Protocol Guide**](mcp-protocol-guide.md) - Offers a technical deep dive into the Model Context Protocol, explaining message formats, communication channels, and implementation details.

4. [**Progress Report**](progress.md) - Tracks the implementation progress of various tools and features in the MCP server.

## Key Features

- **Remote Terminal Access**: Execute shell commands from a web browser
- **File System Operations**: Read, write, copy, move, and delete files and directories
- **Python Script Execution**: Run Python scripts with arguments
- **Pattern Searching**: Search for patterns in files with regex support
- **Directory Traversal**: Get hierarchical representations of directories
- **Combination Tasks**: Execute sequences of operations with a common working directory
- **Real-time Updates**: Receive command outputs as they happen via Server-Sent Events
- **Tool Discovery**: Automatically discover available tools and their parameters

## Quick Start

### Server Setup

1. Install the MCP server:
   ```bash
   npm install smithery-mcp-server
   ```

2. Start the server:
   ```bash
   mcp-terminal start
   ```

3. The server will be available at `http://localhost:8080`

### Client Integration

To connect to the MCP server from a client application:

1. Establish an SSE connection to get a client ID:
   ```javascript
   const eventSource = new EventSource('http://localhost:8080/sse');
   let clientId = null;
   
   eventSource.onmessage = (event) => {
     const data = JSON.parse(event.data);
     if (data.type === 'connected') {
       clientId = data.clientId;
     }
   };
   ```

2. Invoke tools using the client ID:
   ```javascript
   async function invokeTool(toolName, parameters) {
     const response = await fetch('http://localhost:8080/messages', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         id: `msg-${Date.now()}`,
         type: 'invoke_tool',
         content: {
           name: toolName,
           parameters: parameters
         },
         clientId: clientId
       })
     });
     
     return await response.json();
   }
   ```

### AI Integration

To integrate the MCP server with an AI application like Claude:

1. Configure Claude to use the MCP server:
   ```json
   {
     "mcpServers": {
       "local-tools": {
         "url": "http://localhost:8080/sse",
         "command": "local-tools"
       }
     }
   }
   ```

2. Prompt Claude to use the MCP server:
   ```
   I have an MCP server running locally at http://localhost:8080. Please use this server to help me manage my files and execute commands.
   ```

## Available Tools

The MCP server provides the following tools:

1. `runShellCommand` - Execute shell commands
2. `runPythonFile` - Execute Python scripts
3. `readDirectory` - List files and directories
4. `copyFile` - Copy files between locations
5. `createFile` - Create new files with content
6. `readFile` - Read file content
7. `editFile` - Modify existing files
8. `deleteFile` - Delete files
9. `moveFile` - Move files between locations
10. `createDirectory` - Create directories
11. `moveDirectory` - Move directories
12. `copyDirectory` - Copy directories
13. `deleteDirectory` - Delete directories
14. `getDirectoryTree` - Get hierarchical directory structure
15. `combinationTask` - Run sequences of operations
16. `grep` - Search for patterns in files

## Security Considerations

When using the MCP server, keep these security considerations in mind:

1. **Permission Boundaries**: The MCP server executes commands with the same permissions as the user who started it
2. **Network Exposure**: It's recommended to run the server on a local network or behind a firewall
3. **Authentication**: Consider using a reverse proxy with authentication for public-facing deployments
4. **Input Validation**: Always validate inputs before passing them to MCP tools
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Audit Logging**: Log all tool invocations for security auditing

## Contributing

Contributions to the MCP server and its documentation are welcome! Please feel free to submit pull requests or open issues for bugs, feature requests, or documentation improvements.

## License

The MCP server is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.
