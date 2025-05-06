# MCP Protocol Technical Guide

This document provides a technical overview of the Model Context Protocol (MCP), explaining how it works, the message format, and the underlying communication mechanisms.

## Table of Contents

1. [Introduction](#introduction)
2. [Protocol Overview](#protocol-overview)
3. [Message Format](#message-format)
4. [Communication Channels](#communication-channels)
5. [Session Management](#session-management)
6. [Tool Registration and Discovery](#tool-registration-and-discovery)
7. [Error Handling](#error-handling)
8. [Implementation Details](#implementation-details)

## Introduction

The Model Context Protocol (MCP) is a standardized communication protocol that enables AI models to interact with external systems through a set of predefined tools. It provides a structured way for AI applications to execute commands, access files, and perform other system operations in a controlled and secure manner.

The MCP protocol is implemented by the `@modelcontextprotocol/sdk` package, which provides both server and client components for building MCP-compatible applications.

## Protocol Overview

At a high level, the MCP protocol consists of:

1. **Connection Establishment**: Clients establish a persistent connection to the server using Server-Sent Events (SSE)
2. **Session Management**: The server assigns a unique client ID to each connection and maintains session state
3. **Tool Discovery**: Clients can query the server to discover available tools and their schemas
4. **Tool Invocation**: Clients send requests to invoke specific tools with parameters
5. **Result Delivery**: The server executes the requested tools and returns results to the client

The protocol is designed to be:
- **Stateful**: Maintaining client sessions for context
- **Asynchronous**: Supporting long-running operations
- **Extensible**: Allowing new tools to be added easily
- **Language-Agnostic**: Working with any client that can make HTTP requests

## Message Format

The MCP protocol uses JSON for all messages. There are several message types:

### 1. Connection Message

Sent by the server when a client establishes an SSE connection:

```json
{
  "type": "connected",
  "clientId": "1683721045873"
}
```

### 2. Tool Invocation Request

Sent by the client to invoke a tool:

```json
{
  "id": "msg-1683721046123",
  "type": "invoke_tool",
  "content": {
    "name": "runShellCommand",
    "parameters": {
      "command": "ls -la"
    }
  },
  "clientId": "1683721045873"
}
```

### 3. Tool Result Message

Sent by the server in response to a tool invocation:

```json
{
  "id": "msg-1683721046123",
  "type": "tool_result",
  "content": {
    "content": [
      {
        "type": "text",
        "text": "total 32\ndrwxr-xr-x  5 user user 4096 May 10 12:34 .\ndrwxr-xr-x 10 user user 4096 May 10 12:30 ..\n-rw-r--r--  1 user user  123 May 10 12:32 file.txt\n..."
      }
    ]
  }
}
```

### 4. Error Message

Sent by the server when an error occurs:

```json
{
  "id": "msg-1683721046123",
  "type": "error",
  "error": {
    "message": "Tool 'unknownTool' not found",
    "code": "TOOL_NOT_FOUND"
  }
}
```

### 5. Ping Message

Sent by the server to keep the SSE connection alive:

```
: ping
```

## Communication Channels

The MCP protocol uses two main communication channels:

### 1. Server-Sent Events (SSE)

The primary channel for server-to-client communication:
- Client establishes a connection to `/sse` endpoint
- Server keeps the connection open and sends messages as events
- Messages include connection confirmation, tool results, and pings
- Connection is maintained until explicitly closed by either party

### 2. HTTP POST Requests

Used for client-to-server communication:
- Client sends tool invocation requests to `/messages` endpoint
- Server processes the request and returns a response
- Same message format is used for both SSE and HTTP responses
- HTTP responses provide immediate feedback while SSE provides real-time updates

## Session Management

The MCP server maintains session state for each connected client:

1. **Session Creation**:
   - Client connects to the `/sse` endpoint
   - Server generates a unique client ID (timestamp-based)
   - Server creates a session object with the client's response object and empty message queue
   - Server sends the client ID to the client

2. **Session Tracking**:
   - Sessions are stored in a Map with client ID as the key
   - Each session contains the SSE response object, message queue, and last ping timestamp
   - Server periodically sends pings to keep the connection alive
   - Server monitors connection status and cleans up disconnected sessions

3. **Session Termination**:
   - When client disconnects, the `close` event is triggered
   - Server removes the session from the sessions map
   - Server cleans up any resources associated with the session

## Tool Registration and Discovery

The MCP server provides a mechanism for registering and discovering tools:

### Tool Registration

Tools are registered with the server using the `tool` method:

```javascript
server.tool(
  "toolName",                // Tool name
  "Tool description",        // Tool description
  {                          // Parameter schema (using Zod)
    param1: z.string().describe("Parameter description"),
    param2: z.number().optional().describe("Optional parameter")
  },
  async ({ param1, param2 }) => {  // Tool implementation
    // Tool logic here
    return {
      content: [{ type: "text", text: "Result" }]
    };
  }
);
```

### Tool Discovery

Clients can discover available tools by querying the `/tools` endpoint, which returns:

```json
{
  "count": 16,
  "tools": [
    {
      "name": "runShellCommand",
      "description": "Run a terminal command in the system shell",
      "parameters": {
        "command": {
          "type": "string",
          "description": "The shell command to execute",
          "required": true
        }
      },
      "examples": ["runShellCommand({ \"command\": \"ls -la\" })"]
    },
    // Additional tools...
  ]
}
```

## Error Handling

The MCP protocol includes comprehensive error handling:

1. **Tool Invocation Errors**:
   - Invalid parameters: Server validates parameters against the tool's schema
   - Tool not found: Server checks if the requested tool exists
   - Execution errors: Errors that occur during tool execution

2. **Connection Errors**:
   - Invalid client ID: Client provides a client ID that doesn't exist
   - Connection timeout: SSE connection times out
   - Network errors: Communication failures between client and server

3. **Error Responses**:
   - HTTP status codes: 400 for client errors, 500 for server errors
   - Structured error messages: Include error code and descriptive message
   - Error propagation: Errors are sent via both HTTP response and SSE

## Implementation Details

The MCP server is implemented using:

1. **Express.js**: For HTTP server and routing
2. **Server-Sent Events**: For real-time communication
3. **Zod**: For schema validation
4. **Node.js**: For the runtime environment

Key implementation components:

### Server Setup

```javascript
const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

// Register tools
server.tool(/* ... */);

// Create Express app
const app = express();
const httpServer = http.createServer(app);

// Add routes
app.get('/sse', handleSSE);
app.post('/messages', handleMessages);
app.get('/tools', handleToolsDiscovery);
```

### Session Management

```javascript
const sessions = new Map<string, ClientSession>();

// SSE endpoint
app.get('/sse', (req: Request, res: Response) => {
  const clientId = Date.now().toString();
  
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Initialize client session
  sessions.set(clientId, {
    res,
    messageQueue: [],
    lastPing: Date.now()
  });

  // Send initial message
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    sessions.delete(clientId);
  });
});
```

### Tool Invocation

```javascript
app.post('/messages', async (req: Request, res: Response) => {
  const { id, type, content, clientId } = req.body;

  // Validate client ID
  if (!sessions.has(clientId)) {
    return res.status(400).json({
      error: 'No active SSE connection',
      message: 'Your session may have expired'
    });
  }

  // Handle tool invocation
  if (type === 'invoke_tool') {
    const { name, parameters } = content;
    
    try {
      // Execute the tool
      const result = await server.executeTool(name, parameters);
      
      // Send response
      const responseMsg = {
        id,
        type: 'tool_result',
        content: result
      };
      
      // Return via HTTP
      res.status(200).json(responseMsg);
      
      // Also send via SSE
      const session = sessions.get(clientId);
      session.res.write(`data: ${JSON.stringify(responseMsg)}\n\n`);
    } catch (error) {
      // Handle error
      res.status(500).json({
        error: 'Tool execution failed',
        message: error.message
      });
    }
  }
});
```
