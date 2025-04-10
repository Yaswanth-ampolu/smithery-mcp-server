import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import {
  runShellCommand,
  runPythonFile,
  readDirectory,
  copyFile,
  createFile
} from "./system.js";

// Load environment variables
dotenv.config();

// Get server configuration from environment variables
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const SERVER_NAME = process.env.SERVER_NAME || "MCP System Tools";
const SERVER_VERSION = process.env.SERVER_VERSION || "1.0.0";

// Create an MCP server
const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

// Register tools
server.tool(
  "runShellCommand",
  "Run a terminal command in the system shell",
  {
    command: z.string().describe("The shell command to execute"),
  },
  async ({ command }) => {
    console.log(`Executing shell command: ${command}`);
    try {
      const output = await runShellCommand(command);
      console.log(`Command result: ${output.substring(0, 100)}${output.length > 100 ? '...' : ''}`);
      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      console.error(`Error executing command: ${error}`);
      return {
        content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
      };
    }
  }
);

server.tool(
  "runPythonFile",
  "Execute a Python file and return output",
  {
    filePath: z.string().describe("Path to the Python file to execute"),
    args: z.string().optional().describe("Optional arguments to pass to the Python script"),
  },
  async ({ filePath, args }) => {
    const output = await runPythonFile(filePath, args);
    return {
      content: [{ type: "text", text: output }],
    };
  }
);

server.tool(
  "readDirectory",
  "List files and folders in a directory",
  {
    dirPath: z.string().optional().describe("Path to the directory to read (default: workspace root)"),
  },
  async ({ dirPath }) => {
    try {
      const result = await readDirectory(dirPath || "");
      return {
        content: [
          { 
            type: "text", 
            text: JSON.stringify(result, null, 2) 
          }
        ],
      };
    } catch (error) {
      return {
        content: [
          { 
            type: "text", 
            text: error instanceof Error ? error.message : "Unknown error" 
          }
        ],
      };
    }
  }
);

server.tool(
  "copyFile",
  "Copy a file from one location to another",
  {
    sourcePath: z.string().describe("Path to the source file"),
    destinationPath: z.string().describe("Path to the destination file"),
  },
  async ({ sourcePath, destinationPath }) => {
    try {
      await copyFile(sourcePath, destinationPath);
      return {
        content: [
          { 
            type: "text", 
            text: `Successfully copied file from ${sourcePath} to ${destinationPath}` 
          }
        ],
      };
    } catch (error) {
      return {
        content: [
          { 
            type: "text", 
            text: error instanceof Error ? error.message : "Unknown error" 
          }
        ],
      };
    }
  }
);

server.tool(
  "createFile",
  "Create a new file with specified contents",
  {
    filePath: z.string().describe("Path to the file to create"),
    content: z.string().describe("Content to write to the file"),
  },
  async ({ filePath, content }) => {
    try {
      await createFile(filePath, content);
      return {
        content: [
          { 
            type: "text", 
            text: `Successfully created file at ${filePath}` 
          }
        ],
      };
    } catch (error) {
      return {
        content: [
          { 
            type: "text", 
            text: error instanceof Error ? error.message : "Unknown error" 
          }
        ],
      };
    }
  }
);

// Create Express app and HTTP server
const app = express();
const httpServer = http.createServer(app);

// Apply middleware
app.use(cors());
app.use(express.json());

// Simple approach: global transport with ID
let activeTransport: SSEServerTransport | null = null;
let transportCreationTime = 0;

// Set up SSE endpoint
app.get('/sse', (req: Request, res: Response) => {
  console.log('SSE connection request from', req.ip);
  
  // Create and store the transport
  activeTransport = new SSEServerTransport('/messages', res);
  transportCreationTime = Date.now();
  
  console.log('New SSE connection established at', new Date(transportCreationTime).toISOString());
  
  // Handle client disconnect
  req.on('close', () => {
    console.log('Client disconnected from SSE connection');
    // Only clear if it's still our transport (based on time)
    if (activeTransport && transportCreationTime) {
      activeTransport = null;
      transportCreationTime = 0;
    }
  });
  
  // Connect the transport to the server
  server.connect(activeTransport).catch(err => {
    console.error('Error connecting server to transport:', err);
    activeTransport = null;
    transportCreationTime = 0;
  });
});

// Set up message endpoint
app.post('/messages', (req: Request, res: Response) => {
  console.log('Received message at', new Date().toISOString(), ':', req.body);
  
  if (!activeTransport) {
    console.log('No active SSE connection');
    res.status(400).json({ 
      error: 'No active SSE connection',
      message: 'Please connect to /sse endpoint first'
    });
    return;
  }
  
  console.log('Handling message with transport created at', new Date(transportCreationTime).toISOString());
  
  // Using the active transport
  activeTransport.handlePostMessage(req, res)
    .then(() => {
      console.log('Message handled successfully');
    })
    .catch((err: Error) => {
      console.error('Error handling message:', err);
      // Only set headers if they haven't been sent already
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal server error',
          message: err.message 
        });
      }
    });
});

// Serve static files
app.use(express.static('public'));

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP Server listening on all interfaces at port ${PORT}`);
}); 