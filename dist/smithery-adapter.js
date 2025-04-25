import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import os from "os";
import { runShellCommand, runPythonFile, readDirectory, copyFile, createFile, readFile, editFile, deleteFile, moveFile, createDirectory, moveDirectory, copyDirectory, deleteDirectory, getDirectoryTree, grepFiles, combinationTask } from "./system.js";
import { getDefaultWorkspace, ensureWorkspaceExists } from "./platform-paths.js";
// Load environment variables
dotenv.config();
// Get server configuration from environment variables
const SERVER_NAME = process.env.SERVER_NAME || "MCP System Tools";
const SERVER_VERSION = process.env.SERVER_VERSION || "1.0.0";
// Determine and ensure workspace directory
const DEFAULT_WORKSPACE = ensureWorkspaceExists(getDefaultWorkspace());
// Log server info for stdio adapter
console.error(`
=================================================
  MCP Server ${SERVER_VERSION} - ${SERVER_NAME} (Stdio Adapter)
=================================================
OS: ${os.platform()} ${os.release()} (${os.arch()})
Node: ${process.version}
Workspace: ${DEFAULT_WORKSPACE}
=================================================
`);
// Create an MCP server
const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
});
// Register tools
server.tool("runShellCommand", "Run a terminal command in the system shell", {
    command: z.string().describe("The shell command to execute"),
}, async ({ command }) => {
    console.error(`Executing shell command: ${command}`);
    try {
        const output = await runShellCommand(command);
        console.error(`Command result: ${output.substring(0, 100)}${output.length > 100 ? '...' : ''}`);
        return {
            content: [{ type: "text", text: output || "Command executed successfully (no output)" }],
        };
    }
    catch (error) {
        console.error(`Error executing command: ${error}`);
        return {
            content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
        };
    }
});
server.tool("runPythonFile", "Execute a Python file and return output", {
    filePath: z.string().describe("Path to the Python file to execute"),
    args: z.string().optional().describe("Optional arguments to pass to the Python script"),
}, async ({ filePath, args }) => {
    const output = await runPythonFile(filePath, args);
    return {
        content: [{ type: "text", text: output }],
    };
});
server.tool("readDirectory", "List files and folders in a directory", {
    dirPath: z.string().optional().describe("Path to the directory to read (default: workspace root)"),
}, async ({ dirPath }) => {
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
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error instanceof Error ? error.message : "Unknown error"
                }
            ],
        };
    }
});
server.tool("copyFile", "Copy a file from one location to another", {
    sourcePath: z.string().describe("Path to the source file"),
    destinationPath: z.string().describe("Path to the destination file"),
}, async ({ sourcePath, destinationPath }) => {
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
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error instanceof Error ? error.message : "Unknown error"
                }
            ],
        };
    }
});
server.tool("createFile", "Create a new file with specified contents", {
    filePath: z.string().describe("Path to the file to create"),
    content: z.string().describe("Content to write to the file"),
}, async ({ filePath, content }) => {
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
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error instanceof Error ? error.message : "Unknown error"
                }
            ],
        };
    }
});
server.tool("readFile", "Read the contents of a file", {
    filePath: z.string().describe("Path to the file to read"),
    encoding: z.string().optional().describe("File encoding (default: utf8)"),
    startLine: z.number().optional().describe("Start line (0-based, inclusive)"),
    endLine: z.number().optional().describe("End line (0-based, inclusive)"),
}, async ({ filePath, encoding, startLine, endLine }) => {
    try {
        const content = await readFile(filePath, {
            encoding: encoding,
            startLine,
            endLine
        });
        return {
            content: [{ type: "text", text: content }],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error instanceof Error ? error.message : "Unknown error"
                }
            ],
        };
    }
});
server.tool("editFile", "Edit an existing file", {
    filePath: z.string().describe("Path to the file to edit"),
    operation: z.enum(["append", "prepend", "replace", "insert"]).describe("Edit operation"),
    content: z.string().describe("Content to add or replace with"),
    lineNumber: z.number().optional().describe("Line number for insert operation (0-based)"),
    startLine: z.number().optional().describe("Start line for replace operation (0-based, inclusive)"),
    endLine: z.number().optional().describe("End line for replace operation (0-based, inclusive)"),
    encoding: z.string().optional().describe("File encoding (default: utf8)"),
}, async ({ filePath, operation, content, lineNumber, startLine, endLine, encoding }) => {
    try {
        await editFile(filePath, {
            operation,
            content,
            lineNumber,
            startLine,
            endLine,
            encoding: encoding
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Successfully edited file at ${filePath}`
                }
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error instanceof Error ? error.message : "Unknown error"
                }
            ],
        };
    }
});
server.tool("deleteFile", "Delete a file", {
    filePath: z.string().describe("Path to the file to delete"),
}, async ({ filePath }) => {
    try {
        await deleteFile(filePath);
        return {
            content: [
                {
                    type: "text",
                    text: `Successfully deleted file at ${filePath}`
                }
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error instanceof Error ? error.message : "Unknown error"
                }
            ],
        };
    }
});
server.tool("moveFile", "Move a file from one location to another", {
    sourcePath: z.string().describe("Path to the source file"),
    destinationPath: z.string().describe("Path to the destination file"),
}, async ({ sourcePath, destinationPath }) => {
    try {
        await moveFile(sourcePath, destinationPath);
        return {
            content: [
                {
                    type: "text",
                    text: `Successfully moved file from ${sourcePath} to ${destinationPath}`
                }
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error instanceof Error ? error.message : "Unknown error"
                }
            ],
        };
    }
});
server.tool("createDirectory", "Create a new directory", {
    dirPath: z.string().describe("Path to the directory to create"),
    recursive: z.boolean().optional().describe("Create parent directories if they don't exist (default: true)"),
}, async ({ dirPath, recursive }) => {
    try {
        await createDirectory(dirPath, recursive);
        return {
            content: [
                {
                    type: "text",
                    text: `Successfully created directory at ${dirPath}`
                }
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error instanceof Error ? error.message : "Unknown error"
                }
            ],
        };
    }
});
server.tool("moveDirectory", "Move a directory from one location to another", {
    sourcePath: z.string().describe("Path to the source directory"),
    destinationPath: z.string().describe("Path to the destination directory"),
}, async ({ sourcePath, destinationPath }) => {
    try {
        await moveDirectory(sourcePath, destinationPath);
        return {
            content: [
                {
                    type: "text",
                    text: `Successfully moved directory from ${sourcePath} to ${destinationPath}`
                }
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error instanceof Error ? error.message : "Unknown error"
                }
            ],
        };
    }
});
server.tool("copyDirectory", "Copy a directory from one location to another", {
    sourcePath: z.string().describe("Path to the source directory"),
    destinationPath: z.string().describe("Path to the destination directory"),
    overwrite: z.boolean().optional().describe("Overwrite existing files (default: false)"),
    errorOnExist: z.boolean().optional().describe("Throw error if destination exists (default: false)"),
}, async ({ sourcePath, destinationPath, overwrite, errorOnExist }) => {
    try {
        await copyDirectory(sourcePath, destinationPath, { overwrite, errorOnExist });
        return {
            content: [
                {
                    type: "text",
                    text: `Successfully copied directory from ${sourcePath} to ${destinationPath}`
                }
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error instanceof Error ? error.message : "Unknown error"
                }
            ],
        };
    }
});
server.tool("deleteDirectory", "Delete a directory", {
    dirPath: z.string().describe("Path to the directory to delete"),
    recursive: z.boolean().optional().describe("Delete subdirectories and files (default: true)"),
}, async ({ dirPath, recursive }) => {
    try {
        await deleteDirectory(dirPath, recursive);
        return {
            content: [
                {
                    type: "text",
                    text: `Successfully deleted directory at ${dirPath}`
                }
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error instanceof Error ? error.message : "Unknown error"
                }
            ],
        };
    }
});
server.tool("getDirectoryTree", "Get a hierarchical representation of a directory", {
    dirPath: z.string().describe("Path to the directory"),
    maxDepth: z.number().optional().describe("Maximum depth to traverse (default: unlimited)"),
    includeFiles: z.boolean().optional().describe("Include files in the tree (default: true)"),
    includeDirs: z.boolean().optional().describe("Include directories in the tree (default: true)"),
    includeSize: z.boolean().optional().describe("Include file sizes (default: false)"),
    extensions: z.array(z.string()).optional().describe("Filter files by extensions (default: all files)"),
    exclude: z.array(z.string()).optional().describe("Paths to exclude from the tree (default: none)"),
}, async ({ dirPath, maxDepth, includeFiles, includeDirs, includeSize, extensions, exclude }) => {
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
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error instanceof Error ? error.message : "Unknown error"
                }
            ],
        };
    }
});
server.tool("grep", "Search for patterns in files (grep)", {
    pattern: z.string().describe("Pattern to search for (string or regex)"),
    filePaths: z.union([z.string(), z.array(z.string())]).describe("File path(s) to search in"),
    useRegex: z.boolean().optional().describe("Treat pattern as regex (default: true)"),
    caseSensitive: z.boolean().optional().describe("Case sensitive search (default: false)"),
    beforeContext: z.number().optional().describe("Number of lines of context before match (default: 0)"),
    afterContext: z.number().optional().describe("Number of lines of context after match (default: 0)"),
    maxMatches: z.number().optional().describe("Maximum number of matches to return (default: unlimited)"),
    encoding: z.string().optional().describe("File encoding (default: utf8)"),
}, async ({ pattern, filePaths, useRegex, caseSensitive, beforeContext, afterContext, maxMatches, encoding }) => {
    try {
        const matches = await grepFiles(pattern, filePaths, {
            useRegex,
            caseSensitive,
            beforeContext,
            afterContext,
            maxMatches,
            encoding: encoding
        });
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify(matches, null, 2)
                }],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error instanceof Error ? error.message : "Unknown error"
                }
            ],
        };
    }
});
server.tool("combinationTask", "Run a sequence of operations with a common working directory", {
    workingDir: z.string().describe("Working directory for all tasks"),
    tasks: z.array(z.object({
        type: z.string().describe("Task type"),
        params: z.record(z.any()).describe("Task parameters")
    })).describe("List of tasks to execute"),
    stopOnError: z.boolean().optional().describe("Stop execution on first error (default: true)"),
}, async ({ workingDir, tasks, stopOnError }) => {
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
            }
            else {
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
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error instanceof Error ? error.message : "Unknown error"
                }
            ],
        };
    }
});
// Create a stdio transport
const transport = new StdioServerTransport();
// Connect the server to the transport
server.connect(transport).catch(err => {
    console.error("Error connecting to transport:", err);
    process.exit(1);
});
//# sourceMappingURL=smithery-adapter.js.map