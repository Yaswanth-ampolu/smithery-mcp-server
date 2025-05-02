# MCP Server Integration Guide

This document explains how to integrate the MCP (Model Context Protocol) server with external AI applications, specifically focusing on how to connect to the MCP server, send requests, and use the available tools.

## Table of Contents

1. [Introduction to MCP Server](#introduction-to-mcp-server)
2. [Server Architecture](#server-architecture)
3. [API Endpoints](#api-endpoints)
4. [Client Connection](#client-connection)
5. [Tool Usage](#tool-usage)
6. [Integration with AI Applications](#integration-with-ai-applications)
7. [Example Code](#example-code)
8. [Troubleshooting](#troubleshooting)

## Introduction to MCP Server

The MCP (Model Context Protocol) server is a powerful tool that provides a standardized way for AI applications to interact with the file system, execute commands, and perform various operations on a remote server. It exposes a set of tools through a RESTful API that can be used by AI applications to perform tasks such as:

- Running shell commands
- Reading and writing files
- Managing directories
- Searching for patterns in files
- Executing Python scripts
- And more

The MCP server is designed to be language-agnostic, allowing any application that can make HTTP requests to interact with it.

## Server Architecture

The MCP server is built on Node.js and Express, and it exposes its functionality through a RESTful API. The server has two main components:

1. **HTTP API**: Provides endpoints for tool invocation and server information
2. **Server-Sent Events (SSE)**: Enables real-time communication between the client and server

The server uses a session-based approach to maintain client connections, with each client identified by a unique client ID.

## API Endpoints

The MCP server exposes the following main endpoints:

### 1. `/sse` - Server-Sent Events Endpoint

- **Method**: GET
- **Description**: Establishes a persistent connection for real-time communication
- **Response**: Provides a client ID and maintains an open connection

### 2. `/messages` - Tool Invocation Endpoint

- **Method**: POST
- **Description**: Used to invoke tools on the server
- **Request Body**:
  ```json
  {
    "id": "message-id",
    "type": "invoke_tool",
    "content": {
      "name": "toolName",
      "parameters": {
        "param1": "value1",
        "param2": "value2"
      }
    },
    "clientId": "client-id-from-sse-connection"
  }
  ```
- **Response**: Returns the result of the tool invocation

### 3. `/tools` - Tools Discovery Endpoint

- **Method**: GET
- **Description**: Returns information about all available tools
- **Response**: JSON object containing tool names, descriptions, parameters, and examples

### 4. `/info` - Server Information Endpoint

- **Method**: GET
- **Description**: Returns information about the server
- **Response**: JSON object containing server name, version, and other details

## Client Connection

To connect to the MCP server from an external application, follow these steps:

### Step 1: Establish an SSE Connection

First, establish a Server-Sent Events (SSE) connection to receive real-time updates and get a client ID:

```javascript
// Using the EventSource API in browsers
const eventSource = new EventSource('http://localhost:8080/sse');
let clientId = null;

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'connected') {
    clientId = data.clientId;
    console.log(`Connected to MCP server with client ID: ${clientId}`);
  } else if (data.type === 'tool_result') {
    console.log('Tool result received:', data.content);
  }
};

eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
  eventSource.close();
};
```

For Node.js applications, you can use the `eventsource` package:

```javascript
const EventSource = require('eventsource');
const eventSource = new EventSource('http://localhost:8080/sse');
// Rest of the code is the same as above
```

### Step 2: Invoke Tools

Once you have a client ID, you can invoke tools by sending POST requests to the `/messages` endpoint:

```javascript
async function invokeTool(toolName, parameters) {
  if (!clientId) {
    throw new Error('Not connected to MCP server');
  }
  
  const response = await fetch('http://localhost:8080/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
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

### Step 3: Handle Tool Results

Tool results can be received either through the SSE connection or as the response to the POST request. It's recommended to handle both to ensure robustness.

## Tool Usage

The MCP server provides a variety of tools that can be used to perform different operations. Here's how to use some of the most common tools:

### 1. `runShellCommand` - Execute Shell Commands

```javascript
// Example: List files in a directory
const result = await invokeTool('runShellCommand', {
  command: 'ls -la'
});
```

### 2. `readFile` - Read File Contents

```javascript
// Example: Read a file
const result = await invokeTool('readFile', {
  filePath: 'path/to/file.txt',
  encoding: 'utf8'  // Optional, defaults to utf8
});
```

### 3. `createFile` - Create a New File

```javascript
// Example: Create a new file
const result = await invokeTool('createFile', {
  filePath: 'path/to/newfile.txt',
  content: 'This is the content of the file'
});
```

### 4. `editFile` - Edit an Existing File

```javascript
// Example: Append content to a file
const result = await invokeTool('editFile', {
  filePath: 'path/to/file.txt',
  operation: 'append',
  content: 'This content will be appended to the file'
});

// Example: Replace specific lines in a file
const result = await invokeTool('editFile', {
  filePath: 'path/to/file.txt',
  operation: 'replace',
  startLine: 5,  // 0-based index
  endLine: 10,   // 0-based index
  content: 'This content will replace lines 5-10'
});
```

### 5. `readDirectory` - List Directory Contents

```javascript
// Example: List contents of a directory
const result = await invokeTool('readDirectory', {
  dirPath: 'path/to/directory'  // Optional, defaults to workspace root
});
```

### 6. `getDirectoryTree` - Get Hierarchical Directory Structure

```javascript
// Example: Get directory tree with specific options
const result = await invokeTool('getDirectoryTree', {
  dirPath: 'path/to/directory',
  maxDepth: 3,                    // Optional, maximum depth to traverse
  includeFiles: true,             // Optional, include files in the tree
  includeDirs: true,              // Optional, include directories in the tree
  includeSize: false,             // Optional, include file sizes
  extensions: ['.js', '.ts'],     // Optional, filter by file extensions
  exclude: ['node_modules', 'dist'] // Optional, paths to exclude
});
```

### 7. `grep` - Search for Patterns in Files

```javascript
// Example: Search for a pattern in files
const result = await invokeTool('grep', {
  pattern: 'search term',
  filePaths: ['file1.txt', 'file2.txt'],  // Can be a string or array
  useRegex: true,                         // Optional, treat pattern as regex
  caseSensitive: false,                   // Optional, case-sensitive search
  beforeContext: 2,                       // Optional, lines of context before match
  afterContext: 2                         // Optional, lines of context after match
});
```

### 8. `runPythonFile` - Execute Python Scripts

```javascript
// Example: Run a Python script with arguments
const result = await invokeTool('runPythonFile', {
  filePath: 'path/to/script.py',
  args: '--verbose --output=result.txt'  // Optional, arguments to pass to the script
});
```

### 9. `combinationTask` - Run Multiple Operations

```javascript
// Example: Run multiple operations in sequence
const result = await invokeTool('combinationTask', {
  workingDir: 'path/to/working/directory',
  tasks: [
    {
      type: 'createDirectory',
      params: {
        dirPath: 'new-directory'
      }
    },
    {
      type: 'createFile',
      params: {
        filePath: 'new-directory/file.txt',
        content: 'File content'
      }
    },
    {
      type: 'runShellCommand',
      params: {
        command: 'ls -la new-directory'
      }
    }
  ],
  stopOnError: true  // Optional, stop execution if a task fails
});
```

## Integration with AI Applications

To integrate the MCP server with an AI application like the Platform Dashboard, you need to:

1. **Create a client module** that handles the connection to the MCP server
2. **Expose tool functionality** to the AI components of your application
3. **Handle results** appropriately in your application's UI or logic

### Example Integration Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  AI Application │ ──────> │   MCP Client    │ ──────> │   MCP Server    │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
       ^                           │                            │
       │                           │                            │
       └───────────────────────────┴────────────────────────────┘
                          Results and Updates
```

## Example Code

Here's a complete example of a client module that can be used to connect to the MCP server:

```javascript
// mcp-client.js
const EventSource = require('eventsource');

class McpClient {
  constructor(serverUrl = 'http://localhost:8080') {
    this.serverUrl = serverUrl;
    this.clientId = null;
    this.eventSource = null;
    this.eventHandlers = {
      connected: [],
      toolResult: [],
      error: []
    };
  }

  // Connect to the MCP server
  connect() {
    return new Promise((resolve, reject) => {
      this.eventSource = new EventSource(`${this.serverUrl}/sse`);
      
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            this.clientId = data.clientId;
            this._triggerEvent('connected', this.clientId);
            resolve(this.clientId);
          } else if (data.type === 'tool_result') {
            this._triggerEvent('toolResult', data.content);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
      
      this.eventSource.onerror = (error) => {
        this._triggerEvent('error', error);
        reject(error);
      };
      
      // Set a timeout in case the connection takes too long
      setTimeout(() => {
        if (!this.clientId) {
          this.disconnect();
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }
  
  // Disconnect from the MCP server
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.clientId = null;
  }
  
  // Invoke a tool on the MCP server
  async invokeTool(toolName, parameters) {
    if (!this.clientId) {
      throw new Error('Not connected to MCP server');
    }
    
    const response = await fetch(`${this.serverUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: `msg-${Date.now()}`,
        type: 'invoke_tool',
        content: {
          name: toolName,
          parameters: parameters
        },
        clientId: this.clientId
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tool invocation failed: ${errorText}`);
    }
    
    return await response.json();
  }
  
  // Get information about available tools
  async getTools() {
    const response = await fetch(`${this.serverUrl}/tools`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get tools: ${errorText}`);
    }
    
    return await response.json();
  }
  
  // Get server information
  async getServerInfo() {
    const response = await fetch(`${this.serverUrl}/info`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get server info: ${errorText}`);
    }
    
    return await response.json();
  }
  
  // Register event handlers
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
    return this;
  }
  
  // Trigger event handlers
  _triggerEvent(event, data) {
    if (this.eventHandlers[event]) {
      for (const handler of this.eventHandlers[event]) {
        handler(data);
      }
    }
  }
}

module.exports = McpClient;
```

### Usage in an AI Application

```javascript
const McpClient = require('./mcp-client');

// Create a client instance
const mcpClient = new McpClient('http://localhost:8080');

// Connect to the MCP server
mcpClient.connect()
  .then(clientId => {
    console.log(`Connected to MCP server with client ID: ${clientId}`);
    
    // Get available tools
    return mcpClient.getTools();
  })
  .then(toolsInfo => {
    console.log(`Available tools: ${toolsInfo.count}`);
    
    // Execute a shell command
    return mcpClient.invokeTool('runShellCommand', {
      command: 'ls -la'
    });
  })
  .then(result => {
    console.log('Command result:', result.content[0].text);
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Register event handlers
mcpClient.on('connected', (clientId) => {
  console.log(`Connected with client ID: ${clientId}`);
}).on('toolResult', (result) => {
  console.log('Tool result received:', result);
}).on('error', (error) => {
  console.error('Connection error:', error);
});
```

## Troubleshooting

### Common Issues and Solutions

1. **Connection Refused**
   - Ensure the MCP server is running
   - Check that the server URL is correct
   - Verify that the port is not blocked by a firewall

2. **No Active Session**
   - The client ID may be invalid or expired
   - Reconnect to get a new client ID
   - Check that the server has not restarted

3. **Tool Not Found**
   - Verify that the tool name is correct
   - Use the `/tools` endpoint to get a list of available tools
   - Check for typos in the tool name

4. **Invalid Parameters**
   - Ensure all required parameters are provided
   - Check parameter types (strings, numbers, booleans, arrays)
   - Use the `/tools` endpoint to get parameter information

5. **Permission Denied**
   - The MCP server may not have permission to access the requested resources
   - Check file and directory permissions
   - Ensure the server is running with appropriate privileges

### Debugging Tips

1. **Enable Verbose Logging**
   - Add more logging to your client code
   - Check the MCP server logs for errors

2. **Test with Simple Commands**
   - Start with simple tools like `runShellCommand` with `echo "hello"`
   - Gradually increase complexity

3. **Check Network Traffic**
   - Use browser developer tools or tools like Wireshark to inspect requests
   - Verify that requests are being sent correctly

4. **Verify SSE Connection**
   - Ensure the SSE connection is established and maintained
   - Check for connection timeouts or errors

## Conclusion

The MCP server provides a powerful way for AI applications to interact with the file system and execute commands on a remote server. By following the guidelines in this document, you can integrate the MCP server with your AI application and leverage its capabilities to enhance your application's functionality.

For more information, refer to the MCP server documentation or contact the server administrator.
