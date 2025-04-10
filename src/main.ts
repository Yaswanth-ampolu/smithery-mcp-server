import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express from "express";
import dotenv from "dotenv";
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

// Add system tools
server.tool(
  "runShellCommand",
  "Run a terminal command in the system shell",
  {
    command: z.string().describe("The shell command to execute"),
  },
  async ({ command }) => {
    const output = await runShellCommand(command);
    return {
      content: [{ type: "text", text: output }],
    };
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

// Set up Express server
const app = express();
let transport: SSEServerTransport | undefined = undefined;

// Add middleware to parse JSON
app.use(express.json());

// SSE endpoint for connecting to the MCP server
app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

// Messages endpoint for sending messages to the MCP server
app.post("/messages", async (req, res) => {
  if (!transport) {
    res.status(400).json({ error: "No transport" });
    return;
  }
  await transport.handlePostMessage(req, res);
});

// Serve static files if needed
app.use(express.static("public"));

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`MCP Server listening on all interfaces at port ${PORT}`);
}); 