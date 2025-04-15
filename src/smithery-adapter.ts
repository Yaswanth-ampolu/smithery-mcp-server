import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
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
        content: [{ type: "text", text: output || "Command executed successfully (no output)" }],
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

// Create a stdio transport
const transport = new StdioServerTransport();

// Connect the server to the transport
server.connect(transport).catch(err => {
  console.error("Error connecting to transport:", err);
  process.exit(1);
}); 