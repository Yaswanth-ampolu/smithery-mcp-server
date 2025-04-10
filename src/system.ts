import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

// Get default workspace from environment variable
const DEFAULT_WORKSPACE = process.env.DEFAULT_WORKSPACE || process.cwd();
const PYTHON_PATH = process.env.PYTHON_PATH || "python3";

/**
 * Run a shell command and return its output
 */
export async function runShellCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command);
    return stdout || stderr;
  } catch (error) {
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return `Unknown error occurred`;
  }
}

/**
 * Run a Python file and return its output
 */
export async function runPythonFile(filePath: string, args: string = ""): Promise<string> {
  try {
    // Use the Python path from environment variables
    const command = `${PYTHON_PATH} ${filePath} ${args}`;
    const { stdout, stderr } = await execAsync(command);
    return stdout || stderr;
  } catch (error) {
    if (error instanceof Error) {
      return `Error executing Python file: ${error.message}`;
    }
    return `Unknown error occurred`;
  }
}

/**
 * Read a directory and list its contents
 */
export async function readDirectory(dirPath: string): Promise<{
  files: string[];
  directories: string[];
  path: string;
}> {
  try {
    // If no path provided, use the default workspace
    const resolvedPath = dirPath || DEFAULT_WORKSPACE;
    const absolutePath = path.isAbsolute(resolvedPath) 
      ? resolvedPath 
      : path.join(DEFAULT_WORKSPACE, resolvedPath);
    
    const entries = await fs.readdir(absolutePath, { withFileTypes: true });
    
    const files: string[] = [];
    const directories: string[] = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        directories.push(entry.name);
      } else {
        files.push(entry.name);
      }
    }
    
    return { files, directories, path: absolutePath };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error reading directory: ${error.message}`);
    }
    throw new Error(`Unknown error occurred`);
  }
}

/**
 * Copy a file from source to destination
 */
export async function copyFile(sourcePath: string, destinationPath: string): Promise<void> {
  try {
    // Resolve paths if they are relative
    const resolvedSourcePath = path.isAbsolute(sourcePath) 
      ? sourcePath 
      : path.join(DEFAULT_WORKSPACE, sourcePath);
    
    const resolvedDestPath = path.isAbsolute(destinationPath) 
      ? destinationPath 
      : path.join(DEFAULT_WORKSPACE, destinationPath);
    
    await fs.copyFile(resolvedSourcePath, resolvedDestPath);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error copying file: ${error.message}`);
    }
    throw new Error(`Unknown error occurred`);
  }
}

/**
 * Create a new file with specified contents
 */
export async function createFile(filePath: string, content: string): Promise<void> {
  try {
    // Resolve path if it's relative
    const resolvedPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(DEFAULT_WORKSPACE, filePath);
    
    // Ensure the directory exists
    const directory = path.dirname(resolvedPath);
    await fs.mkdir(directory, { recursive: true });
    
    // Write the file
    await fs.writeFile(resolvedPath, content);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error creating file: ${error.message}`);
    }
    throw new Error(`Unknown error occurred`);
  }
} 