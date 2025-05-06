import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import os from "os";
import {
  runShellCommand,
  runPythonFile,
  readDirectory,
  copyFile,
  createFile,
  readFile,
  editFile,
  deleteFile,
  moveFile,
  createDirectory,
  moveDirectory,
  copyDirectory,
  deleteDirectory,
  getDirectoryTree,
  combinationTask,
  grepFiles
} from "./system.js";
import type { DirectoryTreeNode, CombinationTask, CombinationTaskResult, GrepMatch } from "./system.js";
import { getDefaultWorkspace, ensureWorkspaceExists } from "./platform-paths.js";
import { createToolsRouter } from "./tools-endpoint.js";

// Load environment variables
dotenv.config();

// Get server configuration from environment variables
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const HOST = process.env.MCP_SERVER_HOST || '0.0.0.0';
const SERVER_NAME = process.env.SERVER_NAME || "MCP System Tools";
const SERVER_VERSION = process.env.SERVER_VERSION || "1.0.0";

// Determine and ensure workspace directory
const DEFAULT_WORKSPACE = ensureWorkspaceExists(getDefaultWorkspace());

// Log server info
console.log(`
=================================================
  MCP Server ${SERVER_VERSION} - ${SERVER_NAME}
=================================================
OS: ${os.platform()} ${os.release()} (${os.arch()})
Node: ${process.version}
Workspace: ${DEFAULT_WORKSPACE}
Binding to: ${HOST}:${PORT}
=================================================
`);

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

server.tool(
  "readFile",
  "Read the content of a file",
  {
    filePath: z.string().describe("Path to the file to read"),
    encoding: z.string().optional().describe("File encoding (default: utf8)"),
    startLine: z.number().optional().describe("Start line (0-based, inclusive)"),
    endLine: z.number().optional().describe("End line (0-based, inclusive)"),
  },
  async ({ filePath, encoding, startLine, endLine }) => {
    try {
      const content = await readFile(filePath, {
        encoding: encoding as BufferEncoding,
        startLine,
        endLine
      });

      return {
        content: [{ type: "text", text: content }],
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
  "editFile",
  "Edit the content of an existing file",
  {
    filePath: z.string().describe("Path to the file to edit"),
    operation: z.enum(['append', 'prepend', 'replace', 'insert']).describe("Edit operation to perform"),
    content: z.string().describe("Content to add or replace with"),
    lineNumber: z.number().optional().describe("Line number for insert operation (0-based)"),
    startLine: z.number().optional().describe("Start line for replace operation (0-based, inclusive)"),
    endLine: z.number().optional().describe("End line for replace operation (0-based, inclusive)"),
    encoding: z.string().optional().describe("File encoding (default: utf8)"),
  },
  async ({ filePath, operation, content, lineNumber, startLine, endLine, encoding }) => {
    try {
      await editFile(filePath, {
        operation,
        content,
        lineNumber,
        startLine,
        endLine,
        encoding: encoding as BufferEncoding
      });

      return {
        content: [{
          type: "text",
          text: `Successfully edited file at ${filePath} using ${operation} operation`
        }],
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
  "deleteFile",
  "Delete a file from the filesystem",
  {
    filePath: z.string().describe("Path to the file to delete"),
  },
  async ({ filePath }) => {
    try {
      await deleteFile(filePath);

      return {
        content: [{
          type: "text",
          text: `Successfully deleted file at ${filePath}`
        }],
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
  "moveFile",
  "Move a file from one location to another",
  {
    sourcePath: z.string().describe("Source file path"),
    destinationPath: z.string().describe("Destination file path"),
  },
  async ({ sourcePath, destinationPath }) => {
    try {
      await moveFile(sourcePath, destinationPath);

      return {
        content: [{
          type: "text",
          text: `Successfully moved file from ${sourcePath} to ${destinationPath}`
        }],
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
  "createDirectory",
  "Create a new directory",
  {
    dirPath: z.string().describe("Path to the directory to create"),
    recursive: z.boolean().optional().describe("Create parent directories if they don't exist (default: true)"),
  },
  async ({ dirPath, recursive = true }) => {
    try {
      await createDirectory(dirPath, recursive);

      return {
        content: [{
          type: "text",
          text: `Successfully created directory at ${dirPath}`
        }],
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
  "moveDirectory",
  "Move a directory from one location to another",
  {
    sourcePath: z.string().describe("Source directory path"),
    destinationPath: z.string().describe("Destination path"),
  },
  async ({ sourcePath, destinationPath }) => {
    try {
      await moveDirectory(sourcePath, destinationPath);

      return {
        content: [{
          type: "text",
          text: `Successfully moved directory from ${sourcePath} to ${destinationPath}`
        }],
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
  "copyDirectory",
  "Copy a directory from one location to another",
  {
    sourcePath: z.string().describe("Source directory path"),
    destinationPath: z.string().describe("Destination path"),
    overwrite: z.boolean().optional().describe("Overwrite existing files (default: false)"),
    errorOnExist: z.boolean().optional().describe("Throw error if destination exists (default: false)"),
  },
  async ({ sourcePath, destinationPath, overwrite = false, errorOnExist = false }) => {
    try {
      await copyDirectory(sourcePath, destinationPath, { overwrite, errorOnExist });

      return {
        content: [{
          type: "text",
          text: `Successfully copied directory from ${sourcePath} to ${destinationPath}`
        }],
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
  "deleteDirectory",
  "Delete a directory and its contents",
  {
    dirPath: z.string().describe("Path to the directory to delete"),
    recursive: z.boolean().optional().describe("Delete all subdirectories and files (default: true)"),
  },
  async ({ dirPath, recursive = true }) => {
    try {
      await deleteDirectory(dirPath, recursive);

      return {
        content: [{
          type: "text",
          text: `Successfully deleted directory at ${dirPath}`
        }],
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
  "getDirectoryTree",
  "Get a hierarchical representation of a directory",
  {
    dirPath: z.string().describe("Path to the directory"),
    maxDepth: z.number().optional().describe("Maximum depth to traverse (default: unlimited)"),
    includeFiles: z.boolean().optional().describe("Include files in the tree (default: true)"),
    includeDirs: z.boolean().optional().describe("Include directories in the tree (default: true)"),
    includeSize: z.boolean().optional().describe("Include file sizes (default: false)"),
    extensions: z.array(z.string()).optional().describe("Filter files by extensions (default: all files)"),
    exclude: z.array(z.string()).optional().describe("Paths to exclude from the tree (default: none)"),
  },
  async ({ dirPath, maxDepth, includeFiles, includeDirs, includeSize, extensions, exclude }) => {
    try {
      const tree = await getDirectoryTree(dirPath, {
        maxDepth,
        includeFiles,
        includeDirs,
        includeSize,
        extensions,
        exclude
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(tree, null, 2)
        }],
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
  "grep",
  "Search for patterns in files (grep)",
  {
    pattern: z.string().describe("Pattern to search for (string or regex)"),
    filePaths: z.union([z.string(), z.array(z.string())]).describe("File path(s) to search in"),
    useRegex: z.boolean().optional().describe("Treat pattern as regex (default: true)"),
    caseSensitive: z.boolean().optional().describe("Case sensitive search (default: false)"),
    beforeContext: z.number().optional().describe("Number of lines of context before match (default: 0)"),
    afterContext: z.number().optional().describe("Number of lines of context after match (default: 0)"),
    maxMatches: z.number().optional().describe("Maximum number of matches to return (default: unlimited)"),
    encoding: z.string().optional().describe("File encoding (default: utf8)"),
  },
  async ({ pattern, filePaths, useRegex, caseSensitive, beforeContext, afterContext, maxMatches, encoding }) => {
    try {
      const matches = await grepFiles(pattern, filePaths, {
        useRegex,
        caseSensitive,
        beforeContext,
        afterContext,
        maxMatches,
        encoding: encoding as BufferEncoding
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(matches, null, 2)
        }],
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
  "combinationTask",
  "Run a sequence of operations with a common working directory",
  {
    workingDir: z.string().describe("Working directory for all operations"),
    tasks: z.array(
      z.object({
        type: z.string().describe("Type of task to perform"),
        params: z.record(z.any()).describe("Parameters for the task")
      })
    ).describe("Array of tasks to perform"),
    stopOnError: z.boolean().optional().describe("Stop execution if a task fails (default: true)")
  },
  async ({ workingDir, tasks, stopOnError }) => {
    try {
      const results = await combinationTask(workingDir, tasks, { stopOnError });

      // Format results for display
      const formattedResults = results.map(result => {
        if (result.success) {
          return {
            taskType: result.taskType,
            success: true,
            result: typeof result.result === 'object'
              ? JSON.stringify(result.result, null, 2)
              : result.result
          };
        } else {
          return {
            taskType: result.taskType,
            success: false,
            error: result.error
          };
        }
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(formattedResults, null, 2)
        }],
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

// Add tools router
app.use('/tools', createToolsRouter(server));

// Define a message queue for each client session
interface ClientSession {
  res: Response;
  messageQueue: any[];
  lastPing: number;
}

const sessions = new Map<string, ClientSession>();

// SSE endpoint
app.get('/sse', (req: Request, res: Response) => {
  const clientId = Date.now().toString();
  console.log(`New SSE connection from ${req.ip}, ID: ${clientId}`);

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Initialize client session with response object and message queue
  sessions.set(clientId, {
    res,
    messageQueue: [],
    lastPing: Date.now()
  });

  // Send initial message
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    console.log(`Client ${clientId} disconnected`);
    sessions.delete(clientId);
  });

  // Keep connection alive with pings
  const pingInterval = setInterval(() => {
    if (sessions.has(clientId)) {
      const session = sessions.get(clientId)!;
      try {
        res.write(': ping\n\n');
        session.lastPing = Date.now();
      } catch (err) {
        console.error(`Error sending ping to client ${clientId}`, err);
        clearInterval(pingInterval);
        sessions.delete(clientId);
      }
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);
});

// Message endpoint for invoking tools
app.post('/messages', async (req: Request, res: Response) => {
  const { id, type, content, clientId } = req.body;

  console.log(`Received message ${id} of type ${type} from client ${clientId || 'unknown'}`);

  // If no client ID or no active session, return error
  if (!clientId) {
    res.status(400).json({
      error: 'Missing clientId',
      message: 'Please provide a clientId from your SSE connection'
    });
    return;
  }

  if (!sessions.has(clientId)) {
    const activeClients = Array.from(sessions.keys());
    console.log(`No active session for client ${clientId}. Active clients: ${activeClients.join(', ')}`);

    res.status(400).json({
      error: 'No active SSE connection',
      message: 'Your session may have expired. Please reconnect to /sse endpoint and use the new clientId',
      activeSessions: activeClients.length
    });
    return;
  }

  const session = sessions.get(clientId)!;

  try {
    // Handle tool invocation
    if (type === 'invoke_tool') {
      const { name, parameters } = content;
      console.log(`Invoking tool ${name} with parameters:`, parameters);

      // Execute the tool
      let result;

      try {
        // Call the appropriate function based on tool name
        switch (name) {
          case 'runShellCommand':
            const output = await runShellCommand(parameters.command);
            result = {
              content: [{ type: "text", text: output || "Command executed successfully (no output)" }]
            };
            break;

          case 'runPythonFile':
            const pythonOutput = await runPythonFile(parameters.filePath, parameters.args);
            result = {
              content: [{ type: "text", text: pythonOutput }]
            };
            break;

          case 'readDirectory':
            try {
              const dirResult = await readDirectory(parameters.dirPath || "");
              result = {
                content: [{ type: "text", text: JSON.stringify(dirResult, null, 2) }]
              };
            } catch (error) {
              result = {
                content: [{ type: "text", text: error instanceof Error ? error.message : "Unknown error" }]
              };
            }
            break;

          case 'copyFile':
            try {
              await copyFile(parameters.sourcePath, parameters.destinationPath);
              result = {
                content: [{ type: "text", text: `Successfully copied file from ${parameters.sourcePath} to ${parameters.destinationPath}` }]
              };
            } catch (error) {
              result = {
                content: [{ type: "text", text: error instanceof Error ? error.message : "Unknown error" }]
              };
            }
            break;

          case 'createFile':
            try {
              await createFile(parameters.filePath, parameters.content);
              result = {
                content: [{ type: "text", text: `Successfully created file at ${parameters.filePath}` }]
              };
            } catch (error) {
              result = {
                content: [{ type: "text", text: error instanceof Error ? error.message : "Unknown error" }]
              };
            }
            break;

          case 'readFile':
            try {
              const content = await readFile(parameters.filePath, {
                encoding: parameters.encoding as BufferEncoding,
                startLine: parameters.startLine,
                endLine: parameters.endLine
              });
              result = {
                content: [{ type: "text", text: content }]
              };
            } catch (error) {
              result = {
                content: [{ type: "text", text: error instanceof Error ? error.message : "Unknown error" }]
              };
            }
            break;

          case 'editFile':
            try {
              await editFile(parameters.filePath, {
                operation: parameters.operation,
                content: parameters.content,
                lineNumber: parameters.lineNumber,
                startLine: parameters.startLine,
                endLine: parameters.endLine,
                encoding: parameters.encoding as BufferEncoding
              });
              result = {
                content: [{
                  type: "text",
                  text: `Successfully edited file at ${parameters.filePath} using ${parameters.operation} operation`
                }]
              };
            } catch (error) {
              result = {
                content: [{
                  type: "text",
                  text: error instanceof Error ? error.message : "Unknown error"
                }]
              };
            }
            break;

          case 'deleteFile':
            try {
              await deleteFile(parameters.filePath);
              result = {
                content: [{
                  type: "text",
                  text: `Successfully deleted file at ${parameters.filePath}`
                }]
              };
            } catch (error) {
              result = {
                content: [{
                  type: "text",
                  text: error instanceof Error ? error.message : "Unknown error"
                }]
              };
            }
            break;

          case 'moveFile':
            try {
              await moveFile(parameters.sourcePath, parameters.destinationPath);
              result = {
                content: [{
                  type: "text",
                  text: `Successfully moved file from ${parameters.sourcePath} to ${parameters.destinationPath}`
                }]
              };
            } catch (error) {
              result = {
                content: [{
                  type: "text",
                  text: error instanceof Error ? error.message : "Unknown error"
                }]
              };
            }
            break;

          case 'createDirectory':
            try {
              await createDirectory(parameters.dirPath, parameters.recursive);
              result = {
                content: [{
                  type: "text",
                  text: `Successfully created directory at ${parameters.dirPath}`
                }]
              };
            } catch (error) {
              result = {
                content: [{
                  type: "text",
                  text: error instanceof Error ? error.message : "Unknown error"
                }]
              };
            }
            break;

          case 'moveDirectory':
            try {
              await moveDirectory(parameters.sourcePath, parameters.destinationPath);
              result = {
                content: [{
                  type: "text",
                  text: `Successfully moved directory from ${parameters.sourcePath} to ${parameters.destinationPath}`
                }]
              };
            } catch (error) {
              result = {
                content: [{
                  type: "text",
                  text: error instanceof Error ? error.message : "Unknown error"
                }]
              };
            }
            break;

          case 'copyDirectory':
            try {
              await copyDirectory(
                parameters.sourcePath,
                parameters.destinationPath,
                {
                  overwrite: parameters.overwrite,
                  errorOnExist: parameters.errorOnExist
                }
              );
              result = {
                content: [{
                  type: "text",
                  text: `Successfully copied directory from ${parameters.sourcePath} to ${parameters.destinationPath}`
                }]
              };
            } catch (error) {
              result = {
                content: [{
                  type: "text",
                  text: error instanceof Error ? error.message : "Unknown error"
                }]
              };
            }
            break;

          case 'deleteDirectory':
            try {
              await deleteDirectory(parameters.dirPath, parameters.recursive);
              result = {
                content: [{
                  type: "text",
                  text: `Successfully deleted directory at ${parameters.dirPath}`
                }]
              };
            } catch (error) {
              result = {
                content: [{
                  type: "text",
                  text: error instanceof Error ? error.message : "Unknown error"
                }]
              };
            }
            break;

          case 'getDirectoryTree':
            try {
              const tree = await getDirectoryTree(
                parameters.dirPath,
                {
                  maxDepth: parameters.maxDepth,
                  includeFiles: parameters.includeFiles,
                  includeDirs: parameters.includeDirs,
                  includeSize: parameters.includeSize,
                  extensions: parameters.extensions,
                  exclude: parameters.exclude
                }
              );
              result = {
                content: [{
                  type: "text",
                  text: JSON.stringify(tree, null, 2)
                }]
              };
            } catch (error) {
              result = {
                content: [{
                  type: "text",
                  text: error instanceof Error ? error.message : "Unknown error"
                }]
              };
            }
            break;

          case 'grep':
            try {
              const matches = await grepFiles(
                parameters.pattern,
                parameters.filePaths,
                {
                  useRegex: parameters.useRegex,
                  caseSensitive: parameters.caseSensitive,
                  beforeContext: parameters.beforeContext,
                  afterContext: parameters.afterContext,
                  maxMatches: parameters.maxMatches,
                  encoding: parameters.encoding as BufferEncoding
                }
              );
              result = {
                content: [{
                  type: "text",
                  text: JSON.stringify(matches, null, 2)
                }]
              };
            } catch (error) {
              result = {
                content: [{
                  type: "text",
                  text: error instanceof Error ? error.message : "Unknown error"
                }]
              };
            }
            break;

          case 'combinationTask':
            try {
              const results = await combinationTask(
                parameters.workingDir,
                parameters.tasks,
                { stopOnError: parameters.stopOnError }
              );

              // Format results for display
              const formattedResults = results.map(result => {
                if (result.success) {
                  return {
                    taskType: result.taskType,
                    success: true,
                    result: typeof result.result === 'object'
                      ? JSON.stringify(result.result, null, 2)
                      : result.result
                  };
                } else {
                  return {
                    taskType: result.taskType,
                    success: false,
                    error: result.error
                  };
                }
              });

              result = {
                content: [{
                  type: "text",
                  text: JSON.stringify(formattedResults, null, 2)
                }]
              };
            } catch (error) {
              result = {
                content: [{
                  type: "text",
                  text: error instanceof Error ? error.message : "Unknown error"
                }]
              };
            }
            break;

          default:
            throw new Error(`Tool not found: ${name}`);
        }

        // Send the result via SSE
        const responseMsg = {
          id,
          type: 'tool_result',
          content: result
        };

        // Log message for debugging
        console.log(`Sending tool result for message ${id} to client ${clientId}`);

        // For cross-device compatibility, make the HTTP response the primary method
        // and SSE the fallback

        // Return the result directly in the HTTP response (primary method)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(responseMsg);

        // Also try to send via SSE in the background if the connection is active
        try {
          if (sessions.has(clientId)) {
            session.res.write(`data: ${JSON.stringify(responseMsg)}\n\n`);
          }
        } catch (sseError) {
          console.warn(`Could not send via SSE to client ${clientId}:`, sseError);
          // Don't delete the session here, just log the warning
        }
      } catch (err) {
        console.error(`Error processing tool for client ${clientId}:`, err);

        // Only delete the session if it's a connection error
        if (err instanceof Error &&
            (err.message.includes('socket') ||
             err.message.includes('connection') ||
             err.message.includes('network'))) {
          console.log(`Removing broken session for client ${clientId}`);
          sessions.delete(clientId);
        }

        res.status(500).json({
          error: 'Internal server error',
          message: err instanceof Error ? err.message : String(err)
        });
      }
      return;
    } else {
      res.status(400).json({ error: 'Unsupported message type' });
      return;
    }
  } catch (err) {
    console.error(`Error processing message ${id}:`, err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err)
    });
    return;
  }
});

// Server info endpoint with optional tools information
app.get('/info', (req: Request, res: Response) => {
  const baseInfo = {
    name: SERVER_NAME,
    version: SERVER_VERSION,
    activeSessions: sessions.size,
    platform: os.platform(),
    arch: os.arch(),
    node: process.version,
    workspace: DEFAULT_WORKSPACE
  };

  res.status(200).json(baseInfo);
});

// Serve static files
app.use(express.static('public'));

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('Shutting down server...');

  // Close all SSE connections
  for (const [clientId, session] of sessions.entries()) {
    try {
      session.res.end();
      console.log(`Closed connection for client ${clientId}`);
    } catch (err) {
      console.error(`Error closing connection for client ${clientId}:`, err);
    }
  }

  // Clear all sessions
  sessions.clear();

  // Close HTTP server
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Force exit after timeout
  setTimeout(() => {
    console.error('Forcing server shutdown after timeout');
    process.exit(1);
  }, 5000);
}

// Start server
function startServer(port: number, maxRetries = 3, retryCount = 0) {
  httpServer.listen(port, HOST, () => {
    console.log(`MCP Server listening on ${HOST}:${port}`);
  }).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use.`);

      if (retryCount < maxRetries) {
        const nextPort = port + 1;
        console.log(`Trying next port: ${nextPort}`);
        httpServer.close();
        startServer(nextPort, maxRetries, retryCount + 1);
      } else {
        console.error(`Failed to start server after ${maxRetries} retries.`);
        process.exit(1);
      }
    } else {
      console.error('Error starting server:', err);
      process.exit(1);
    }
  });
}

// Initialize server
startServer(PORT);