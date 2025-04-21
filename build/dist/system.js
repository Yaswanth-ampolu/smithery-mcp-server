import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { getDefaultWorkspace, ensureWorkspaceExists, resolveWorkspacePath } from "./platform-paths.js";
// Load environment variables
dotenv.config();
const execAsync = promisify(exec);
// Get default workspace from environment variable or determine dynamically
const DEFAULT_WORKSPACE = ensureWorkspaceExists(getDefaultWorkspace());
const PYTHON_PATH = process.env.PYTHON_PATH ||
    (process.platform === 'win32' ? 'python' : 'python3');
console.log(`Using workspace directory: ${DEFAULT_WORKSPACE}`);
console.log(`Using Python path: ${PYTHON_PATH}`);
/**
 * Run a shell command and return its output
 */
export async function runShellCommand(command) {
    console.log(`Running shell command: "${command}"`);
    try {
        // Use cross-platform cwd for command execution
        const { stdout, stderr } = await execAsync(command, { cwd: DEFAULT_WORKSPACE });
        // Return a combination of stdout and stderr
        let output = stdout ? stdout.toString().trim() : "";
        if (stderr && stderr.toString().trim()) {
            if (output) {
                output += '\n\n--- STDERR ---\n' + stderr.toString().trim();
            }
            else {
                output = stderr.toString().trim();
            }
        }
        // If there's no output at all, return a message
        if (!output) {
            return "Command executed successfully (no output)";
        }
        return output;
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error running command: ${error.message}`);
            // For exec errors, the stderr is often in error.stderr
            const errOutput = error.stderr || error.message;
            return `Error: ${errOutput}`;
        }
        return `Error: ${String(error)}`;
    }
}
/**
 * Run a Python file and return its output
 */
export async function runPythonFile(filePath, args = "") {
    try {
        // Resolve the file path relative to workspace
        const resolvedPath = resolveWorkspacePath(filePath, DEFAULT_WORKSPACE);
        // Use the Python path from environment variables or platform-specific default
        const command = `${PYTHON_PATH} ${resolvedPath} ${args}`;
        console.log(`Running Python script: "${command}"`);
        const { stdout, stderr } = await execAsync(command, { cwd: DEFAULT_WORKSPACE });
        // Return a combination of stdout and stderr
        let output = stdout ? stdout.toString().trim() : "";
        if (stderr && stderr.toString().trim()) {
            if (output) {
                output += '\n\n--- STDERR ---\n' + stderr.toString().trim();
            }
            else {
                output = stderr.toString().trim();
            }
        }
        // If there's no output at all, return a message
        if (!output) {
            return "Python script executed successfully (no output)";
        }
        return output;
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error running Python script: ${error.message}`);
            // For exec errors, the stderr is often in error.stderr
            const errOutput = error.stderr || error.message;
            return `Error: ${errOutput}`;
        }
        return `Error: ${String(error)}`;
    }
}
/**
 * Read a directory and list its contents
 */
export async function readDirectory(dirPath) {
    try {
        // If no path provided, use the default workspace
        const resolvedPath = dirPath
            ? resolveWorkspacePath(dirPath, DEFAULT_WORKSPACE)
            : DEFAULT_WORKSPACE;
        const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
        const files = [];
        const directories = [];
        for (const entry of entries) {
            if (entry.isDirectory()) {
                directories.push(entry.name);
            }
            else {
                files.push(entry.name);
            }
        }
        return { files, directories, path: resolvedPath };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error reading directory: ${error.message}`);
        }
        throw new Error(`Unknown error occurred`);
    }
}
/**
 * Copy a file from source to destination
 */
export async function copyFile(sourcePath, destinationPath) {
    try {
        // Resolve paths relative to workspace
        const resolvedSourcePath = resolveWorkspacePath(sourcePath, DEFAULT_WORKSPACE);
        const resolvedDestPath = resolveWorkspacePath(destinationPath, DEFAULT_WORKSPACE);
        await fs.copyFile(resolvedSourcePath, resolvedDestPath);
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error copying file: ${error.message}`);
        }
        throw new Error(`Unknown error occurred`);
    }
}
/**
 * Create a new file with specified contents
 */
export async function createFile(filePath, content) {
    try {
        // Resolve path relative to workspace
        const resolvedPath = resolveWorkspacePath(filePath, DEFAULT_WORKSPACE);
        // Ensure the directory exists
        const directory = path.dirname(resolvedPath);
        await fs.mkdir(directory, { recursive: true });
        // Write the file
        await fs.writeFile(resolvedPath, content);
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error creating file: ${error.message}`);
        }
        throw new Error(`Unknown error occurred`);
    }
}
//# sourceMappingURL=system.js.map