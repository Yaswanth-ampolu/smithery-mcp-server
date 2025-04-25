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
export async function runShellCommand(command: string): Promise<string> {
  console.log(`Running shell command: "${command}"`);

  try {
    // Use cross-platform cwd for command execution
    const { stdout, stderr } = await execAsync(command, { cwd: DEFAULT_WORKSPACE });

    // Return a combination of stdout and stderr
    let output = stdout ? stdout.toString().trim() : "";

    if (stderr && stderr.toString().trim()) {
      if (output) {
        output += '\n\n--- STDERR ---\n' + stderr.toString().trim();
      } else {
        output = stderr.toString().trim();
      }
    }

    // If there's no output at all, return a message
    if (!output) {
      return "Command executed successfully (no output)";
    }

    return output;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error running command: ${error.message}`);
      // For exec errors, the stderr is often in error.stderr
      const errOutput = (error as any).stderr || error.message;
      return `Error: ${errOutput}`;
    }
    return `Error: ${String(error)}`;
  }
}

/**
 * Run a Python file and return its output
 */
export async function runPythonFile(filePath: string, args: string = ""): Promise<string> {
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
      } else {
        output = stderr.toString().trim();
      }
    }

    // If there's no output at all, return a message
    if (!output) {
      return "Python script executed successfully (no output)";
    }

    return output;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error running Python script: ${error.message}`);
      // For exec errors, the stderr is often in error.stderr
      const errOutput = (error as any).stderr || error.message;
      return `Error: ${errOutput}`;
    }
    return `Error: ${String(error)}`;
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
    const resolvedPath = dirPath
      ? resolveWorkspacePath(dirPath, DEFAULT_WORKSPACE)
      : DEFAULT_WORKSPACE;

    const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

    const files: string[] = [];
    const directories: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        directories.push(entry.name);
      } else {
        files.push(entry.name);
      }
    }

    return { files, directories, path: resolvedPath };
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
    // Resolve paths relative to workspace
    const resolvedSourcePath = resolveWorkspacePath(sourcePath, DEFAULT_WORKSPACE);
    const resolvedDestPath = resolveWorkspacePath(destinationPath, DEFAULT_WORKSPACE);

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
    // Resolve path relative to workspace
    const resolvedPath = resolveWorkspacePath(filePath, DEFAULT_WORKSPACE);

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

/**
 * Read a file and return its contents
 * Optionally specify line range to read only part of the file
 */
export async function readFile(filePath: string, options?: {
  encoding?: BufferEncoding;
  startLine?: number;
  endLine?: number;
}): Promise<string> {
  try {
    // Resolve path relative to workspace
    const resolvedPath = resolveWorkspacePath(filePath, DEFAULT_WORKSPACE);

    // If we need specific lines, we'll need to read the file line by line
    if (options?.startLine !== undefined || options?.endLine !== undefined) {
      const fileContent = await fs.readFile(resolvedPath, {
        encoding: options?.encoding || 'utf8'
      });

      const lines = fileContent.split('\n');
      const startLine = options?.startLine !== undefined ? options.startLine : 0;
      const endLine = options?.endLine !== undefined ? options.endLine : lines.length - 1;

      return lines.slice(startLine, endLine + 1).join('\n');
    }

    // Otherwise, read the entire file
    return await fs.readFile(resolvedPath, {
      encoding: options?.encoding || 'utf8'
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error reading file: ${error.message}`);
    }
    throw new Error(`Unknown error occurred`);
  }
}

/**
 * Edit a file with various operations (append, prepend, replace, insert)
 */
export async function editFile(
  filePath: string,
  options: {
    operation: 'append' | 'prepend' | 'replace' | 'insert';
    content: string;
    lineNumber?: number;
    startLine?: number;
    endLine?: number;
    encoding?: BufferEncoding;
  }
): Promise<void> {
  try {
    // Resolve path relative to workspace
    const resolvedPath = resolveWorkspacePath(filePath, DEFAULT_WORKSPACE);

    // Read the existing file content
    const existingContent = await fs.readFile(resolvedPath, {
      encoding: options.encoding || 'utf8'
    });

    let newContent: string;

    // Perform the requested operation
    switch (options.operation) {
      case 'append':
        newContent = existingContent + options.content;
        break;

      case 'prepend':
        newContent = options.content + existingContent;
        break;

      case 'replace':
        if (options.startLine !== undefined && options.endLine !== undefined) {
          // Replace specific lines
          const lines = existingContent.split('\n');
          const startLine = Math.max(0, options.startLine);
          const endLine = Math.min(lines.length - 1, options.endLine);

          // Replace the specified lines with the new content
          const beforeLines = lines.slice(0, startLine);
          const afterLines = lines.slice(endLine + 1);
          const newLines = options.content.split('\n');

          newContent = [...beforeLines, ...newLines, ...afterLines].join('\n');
        } else {
          // Replace the entire file
          newContent = options.content;
        }
        break;

      case 'insert':
        if (options.lineNumber !== undefined) {
          // Insert at specific line
          const lines = existingContent.split('\n');
          const lineNumber = Math.min(lines.length, Math.max(0, options.lineNumber));

          // Insert the new content at the specified line
          lines.splice(lineNumber, 0, options.content);
          newContent = lines.join('\n');
        } else {
          // If no line number specified, default to append
          newContent = existingContent + options.content;
        }
        break;

      default:
        throw new Error(`Unsupported operation: ${options.operation}`);
    }

    // Write the modified content back to the file
    await fs.writeFile(resolvedPath, newContent, { encoding: options.encoding || 'utf8' });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error editing file: ${error.message}`);
    }
    throw new Error(`Unknown error occurred`);
  }
}

/**
 * Delete a file from the filesystem
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    // Resolve path relative to workspace
    const resolvedPath = resolveWorkspacePath(filePath, DEFAULT_WORKSPACE);

    // Check if file exists before attempting to delete
    await fs.access(resolvedPath);

    // Delete the file
    await fs.unlink(resolvedPath);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error deleting file: ${error.message}`);
    }
    throw new Error(`Unknown error occurred`);
  }
}

/**
 * Move a file from one location to another
 * Handles cross-device moves by falling back to copy + delete
 */
export async function moveFile(sourcePath: string, destinationPath: string): Promise<void> {
  try {
    // Resolve paths relative to workspace
    const resolvedSourcePath = resolveWorkspacePath(sourcePath, DEFAULT_WORKSPACE);
    let resolvedDestinationPath = resolveWorkspacePath(destinationPath, DEFAULT_WORKSPACE);

    // Check if source file exists
    await fs.access(resolvedSourcePath);

    // Get source file stats
    const sourceStats = await fs.stat(resolvedSourcePath);
    if (!sourceStats.isFile()) {
      throw new Error("Source path must be a file");
    }

    // Check if destination is a directory
    try {
      const destStats = await fs.stat(resolvedDestinationPath);
      if (destStats.isDirectory()) {
        // If destination is a directory, append the source filename to the destination path
        const sourceFileName = path.basename(resolvedSourcePath);
        resolvedDestinationPath = path.join(resolvedDestinationPath, sourceFileName);
      }
    } catch (statError) {
      // If destination doesn't exist, that's fine - we'll create it
      // Just make sure the destination directory exists
      const destDir = path.dirname(resolvedDestinationPath);
      try {
        await fs.access(destDir);
      } catch (accessError) {
        // Create the destination directory if it doesn't exist
        await fs.mkdir(destDir, { recursive: true });
      }
    }

    try {
      // Try to use rename (works on same device)
      await fs.rename(resolvedSourcePath, resolvedDestinationPath);
    } catch (renameError) {
      // If rename fails (possibly cross-device), use copy + delete
      if (renameError instanceof Error &&
          ((renameError as any).code === 'EXDEV' || // Cross-device error code
           renameError.message.includes('cross-device'))) {

        // Copy the file
        await fs.copyFile(resolvedSourcePath, resolvedDestinationPath);

        // Delete the source file
        await fs.unlink(resolvedSourcePath);
      } else {
        // If it's another error, rethrow it
        throw renameError;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error moving file: ${error.message}`);
    }
    throw new Error(`Unknown error occurred`);
  }
}

/**
 * Create a directory with optional recursive creation
 */
export async function createDirectory(dirPath: string, recursive: boolean = true): Promise<void> {
  try {
    // Resolve path relative to workspace
    const resolvedPath = resolveWorkspacePath(dirPath, DEFAULT_WORKSPACE);

    // Create the directory with recursive option
    await fs.mkdir(resolvedPath, { recursive });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error creating directory: ${error.message}`);
    }
    throw new Error(`Unknown error occurred`);
  }
}

/**
 * Helper function to recursively copy directory contents
 */
async function copyDirectoryContents(
  source: string,
  destination: string,
  options: {
    overwrite?: boolean,
    errorOnExist?: boolean
  } = {}
): Promise<void> {
  // Read the source directory
  const entries = await fs.readdir(source, { withFileTypes: true });

  // Process each entry
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Create the directory in the destination
      await fs.mkdir(destPath, { recursive: true });

      // Recursively copy contents
      await copyDirectoryContents(sourcePath, destPath, options);
    } else {
      // Check if destination file exists
      try {
        await fs.access(destPath);
        if (options.errorOnExist) {
          throw new Error(`Destination file already exists: ${destPath}`);
        } else if (!options.overwrite) {
          // Generate a unique name by appending a number
          let counter = 1;
          let newDestPath;
          const extname = path.extname(destPath);
          const basename = path.basename(destPath, extname);
          const dirname = path.dirname(destPath);

          do {
            newDestPath = path.join(dirname, `${basename}_${counter}${extname}`);
            counter++;
            try {
              await fs.access(newDestPath);
            } catch {
              // Path doesn't exist, we can use it
              await fs.copyFile(sourcePath, newDestPath);
              break;
            }
          } while (counter < 100); // Prevent infinite loop
        } else {
          // Overwrite the file
          await fs.copyFile(sourcePath, destPath);
        }
      } catch (accessError) {
        // File doesn't exist, just copy it
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }
}

/**
 * Interface for directory tree node
 */
export interface DirectoryTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryTreeNode[];
  size?: number;
  extension?: string;
}

/**
 * Get a hierarchical representation of a directory
 */
export async function getDirectoryTree(
  dirPath: string,
  options: {
    maxDepth?: number,
    includeFiles?: boolean,
    includeDirs?: boolean,
    includeSize?: boolean,
    extensions?: string[],
    exclude?: string[]
  } = {}
): Promise<DirectoryTreeNode> {
  // Set default options
  const maxDepth = options.maxDepth ?? Infinity;
  const includeFiles = options.includeFiles ?? true;
  const includeDirs = options.includeDirs ?? true;
  const includeSize = options.includeSize ?? false;
  const extensions = options.extensions ?? [];
  const exclude = options.exclude ?? [];

  try {
    // Resolve path relative to workspace
    const resolvedPath = resolveWorkspacePath(dirPath, DEFAULT_WORKSPACE);

    // Check if path exists and is a directory
    const stats = await fs.stat(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error("Path is not a directory");
    }

    // Create the root node
    const rootNode: DirectoryTreeNode = {
      name: path.basename(resolvedPath),
      path: dirPath,
      type: 'directory',
      children: []
    };

    // Build the tree recursively
    await buildDirectoryTree(resolvedPath, rootNode, 0, {
      maxDepth,
      includeFiles,
      includeDirs,
      includeSize,
      extensions,
      exclude
    });

    return rootNode;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error getting directory tree: ${error.message}`);
    }
    throw new Error(`Unknown error occurred`);
  }
}

/**
 * Interface for combination task
 */
export interface CombinationTask {
  type: string;
  params: Record<string, any>;
}

/**
 * Interface for combination task result
 */
export interface CombinationTaskResult {
  taskType: string;
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * Run a sequence of operations with a common working directory
 */
export async function combinationTask(
  workingDir: string,
  tasks: CombinationTask[],
  options: {
    stopOnError?: boolean;
  } = {}
): Promise<CombinationTaskResult[]> {
  // Set default options
  const stopOnError = options.stopOnError ?? true;

  // Resolve the working directory
  const resolvedWorkingDir = resolveWorkspacePath(workingDir, DEFAULT_WORKSPACE);

  // Check if working directory exists
  try {
    const stats = await fs.stat(resolvedWorkingDir);
    if (!stats.isDirectory()) {
      throw new Error(`Working directory is not a directory: ${workingDir}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw new Error(`Working directory does not exist: ${workingDir}`);
    }
    throw error;
  }

  // Initialize results array
  const results: CombinationTaskResult[] = [];

  // Execute each task in sequence
  for (const task of tasks) {
    try {
      let result;

      // Adjust paths in parameters to use the working directory
      const adjustedParams = { ...task.params };

      // Handle different task types
      switch (task.type) {
        case 'readFile':
          if (adjustedParams.filePath) {
            adjustedParams.filePath = path.join(workingDir, adjustedParams.filePath);
          }
          result = await readFile(adjustedParams.filePath, {
            encoding: adjustedParams.encoding,
            startLine: adjustedParams.startLine,
            endLine: adjustedParams.endLine
          });
          break;

        case 'createFile':
          if (adjustedParams.filePath) {
            adjustedParams.filePath = path.join(workingDir, adjustedParams.filePath);
          }
          // Handle overwrite option by checking if file exists first
          if (adjustedParams.overwrite) {
            try {
              await fs.access(resolveWorkspacePath(adjustedParams.filePath, DEFAULT_WORKSPACE));
              // If file exists and overwrite is true, delete it first
              await deleteFile(adjustedParams.filePath);
            } catch (error) {
              // File doesn't exist, which is fine
            }
          }
          await createFile(adjustedParams.filePath, adjustedParams.content);
          result = `File created: ${adjustedParams.filePath}`;
          break;

        case 'editFile':
          if (adjustedParams.filePath) {
            adjustedParams.filePath = path.join(workingDir, adjustedParams.filePath);
          }
          await editFile(adjustedParams.filePath, {
            operation: adjustedParams.operation || 'replace',
            content: adjustedParams.content,
            lineNumber: adjustedParams.lineNumber,
            startLine: adjustedParams.startLine,
            endLine: adjustedParams.endLine,
            encoding: adjustedParams.encoding
          });
          result = `File edited: ${adjustedParams.filePath}`;
          break;

        case 'deleteFile':
          if (adjustedParams.filePath) {
            adjustedParams.filePath = path.join(workingDir, adjustedParams.filePath);
          }
          await deleteFile(adjustedParams.filePath);
          result = `File deleted: ${adjustedParams.filePath}`;
          break;

        case 'moveFile':
          if (adjustedParams.sourcePath) {
            adjustedParams.sourcePath = path.join(workingDir, adjustedParams.sourcePath);
          }
          if (adjustedParams.destinationPath) {
            adjustedParams.destinationPath = path.join(workingDir, adjustedParams.destinationPath);
          }
          // Handle overwrite option by checking if destination file exists first
          if (adjustedParams.overwrite) {
            try {
              await fs.access(resolveWorkspacePath(adjustedParams.destinationPath, DEFAULT_WORKSPACE));
              // If file exists and overwrite is true, delete it first
              await deleteFile(adjustedParams.destinationPath);
            } catch (error) {
              // File doesn't exist, which is fine
            }
          }
          await moveFile(adjustedParams.sourcePath, adjustedParams.destinationPath);
          result = `File moved from ${adjustedParams.sourcePath} to ${adjustedParams.destinationPath}`;
          break;

        case 'copyFile':
          if (adjustedParams.sourcePath) {
            adjustedParams.sourcePath = path.join(workingDir, adjustedParams.sourcePath);
          }
          if (adjustedParams.destinationPath) {
            adjustedParams.destinationPath = path.join(workingDir, adjustedParams.destinationPath);
          }
          // Handle overwrite option by checking if destination file exists first
          if (adjustedParams.overwrite) {
            try {
              await fs.access(resolveWorkspacePath(adjustedParams.destinationPath, DEFAULT_WORKSPACE));
              // If file exists and overwrite is true, delete it first
              await deleteFile(adjustedParams.destinationPath);
            } catch (error) {
              // File doesn't exist, which is fine
            }
          }
          await copyFile(adjustedParams.sourcePath, adjustedParams.destinationPath);
          result = `File copied from ${adjustedParams.sourcePath} to ${adjustedParams.destinationPath}`;
          break;

        case 'readDirectory':
          if (adjustedParams.dirPath) {
            adjustedParams.dirPath = path.join(workingDir, adjustedParams.dirPath);
          }
          result = await readDirectory(adjustedParams.dirPath);
          break;

        case 'createDirectory':
          if (adjustedParams.dirPath) {
            adjustedParams.dirPath = path.join(workingDir, adjustedParams.dirPath);
          }
          await createDirectory(adjustedParams.dirPath, adjustedParams.recursive);
          result = `Directory created: ${adjustedParams.dirPath}`;
          break;

        case 'moveDirectory':
          if (adjustedParams.sourcePath) {
            adjustedParams.sourcePath = path.join(workingDir, adjustedParams.sourcePath);
          }
          if (adjustedParams.destinationPath) {
            adjustedParams.destinationPath = path.join(workingDir, adjustedParams.destinationPath);
          }
          await moveDirectory(adjustedParams.sourcePath, adjustedParams.destinationPath);
          result = `Directory moved from ${adjustedParams.sourcePath} to ${adjustedParams.destinationPath}`;
          break;

        case 'copyDirectory':
          if (adjustedParams.sourcePath) {
            adjustedParams.sourcePath = path.join(workingDir, adjustedParams.sourcePath);
          }
          if (adjustedParams.destinationPath) {
            adjustedParams.destinationPath = path.join(workingDir, adjustedParams.destinationPath);
          }
          await copyDirectory(
            adjustedParams.sourcePath,
            adjustedParams.destinationPath,
            {
              overwrite: adjustedParams.overwrite,
              errorOnExist: adjustedParams.errorOnExist
            }
          );
          result = `Directory copied from ${adjustedParams.sourcePath} to ${adjustedParams.destinationPath}`;
          break;

        case 'deleteDirectory':
          if (adjustedParams.dirPath) {
            adjustedParams.dirPath = path.join(workingDir, adjustedParams.dirPath);
          }
          await deleteDirectory(adjustedParams.dirPath, adjustedParams.recursive);
          result = `Directory deleted: ${adjustedParams.dirPath}`;
          break;

        case 'getDirectoryTree':
          if (adjustedParams.dirPath) {
            adjustedParams.dirPath = path.join(workingDir, adjustedParams.dirPath);
          }
          result = await getDirectoryTree(
            adjustedParams.dirPath,
            {
              maxDepth: adjustedParams.maxDepth,
              includeFiles: adjustedParams.includeFiles,
              includeDirs: adjustedParams.includeDirs,
              includeSize: adjustedParams.includeSize,
              extensions: adjustedParams.extensions,
              exclude: adjustedParams.exclude
            }
          );
          break;

        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }

      // Add successful result
      results.push({
        taskType: task.type,
        success: true,
        result
      });
    } catch (error) {
      // Add error result
      results.push({
        taskType: task.type,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Stop if stopOnError is true
      if (stopOnError) {
        break;
      }
    }
  }

  return results;
}

/**
 * Helper function to build directory tree recursively
 */
async function buildDirectoryTree(
  dirPath: string,
  node: DirectoryTreeNode,
  currentDepth: number,
  options: {
    maxDepth: number,
    includeFiles: boolean,
    includeDirs: boolean,
    includeSize: boolean,
    extensions: string[],
    exclude: string[]
  }
): Promise<void> {
  // Stop if we've reached the maximum depth
  if (currentDepth >= options.maxDepth) {
    return;
  }

  // Read the directory entries
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  // Process each entry
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(
      resolveWorkspacePath('', DEFAULT_WORKSPACE),
      entryPath
    );

    // Skip if this path is in the exclude list
    if (options.exclude.some(excludePath => {
      // Check if the path matches exactly or is a subdirectory of an excluded path
      return relativePath === excludePath ||
             relativePath.startsWith(excludePath + path.sep) ||
             entry.name === excludePath;
    })) {
      continue;
    }

    if (entry.isDirectory() && options.includeDirs) {
      // Create a directory node
      const dirNode: DirectoryTreeNode = {
        name: entry.name,
        path: relativePath,
        type: 'directory',
        children: []
      };

      // Add to parent's children
      node.children!.push(dirNode);

      // Recursively process subdirectory
      await buildDirectoryTree(entryPath, dirNode, currentDepth + 1, options);
    } else if (entry.isFile() && options.includeFiles) {
      // Check file extension if extensions filter is provided
      const extension = path.extname(entry.name).toLowerCase();
      if (options.extensions.length > 0 && !options.extensions.includes(extension)) {
        continue;
      }

      // Create a file node
      const fileNode: DirectoryTreeNode = {
        name: entry.name,
        path: relativePath,
        type: 'file',
        extension: extension
      };

      // Add file size if requested
      if (options.includeSize) {
        const stats = await fs.stat(entryPath);
        fileNode.size = stats.size;
      }

      // Add to parent's children
      node.children!.push(fileNode);
    }
  }

  // Sort children by type (directories first) and then by name
  node.children!.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Delete a directory with optional recursive deletion
 */
export async function deleteDirectory(dirPath: string, recursive: boolean = true): Promise<void> {
  try {
    // Resolve path relative to workspace
    const resolvedPath = resolveWorkspacePath(dirPath, DEFAULT_WORKSPACE);

    // Check if path exists and is a directory
    const stats = await fs.stat(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error("Path is not a directory");
    }

    // Delete the directory with recursive option
    await fs.rm(resolvedPath, { recursive, force: false });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error deleting directory: ${error.message}`);
    }
    throw new Error(`Unknown error occurred`);
  }
}

/**
 * Copy a directory from one location to another with options for handling existing files
 */
export async function copyDirectory(
  sourcePath: string,
  destinationPath: string,
  options: {
    overwrite?: boolean,
    errorOnExist?: boolean
  } = {}
): Promise<void> {
  try {
    // Resolve paths relative to workspace
    const resolvedSourcePath = resolveWorkspacePath(sourcePath, DEFAULT_WORKSPACE);
    let resolvedDestinationPath = resolveWorkspacePath(destinationPath, DEFAULT_WORKSPACE);

    // Check if source directory exists and is a directory
    const sourceStats = await fs.stat(resolvedSourcePath);
    if (!sourceStats.isDirectory()) {
      throw new Error("Source path must be a directory");
    }

    // Check if destination exists
    try {
      const destStats = await fs.stat(resolvedDestinationPath);

      // If destination is a directory, we'll copy the source directory inside it
      if (destStats.isDirectory()) {
        const sourceBaseName = path.basename(resolvedSourcePath);
        resolvedDestinationPath = path.join(resolvedDestinationPath, sourceBaseName);

        // Check if the target path already exists
        try {
          await fs.access(resolvedDestinationPath);
          if (options.errorOnExist) {
            throw new Error(`Destination already exists: ${resolvedDestinationPath}`);
          } else if (!options.overwrite) {
            // Generate a unique name by appending a number
            let counter = 1;
            let newDestPath;
            do {
              newDestPath = `${resolvedDestinationPath}_${counter}`;
              counter++;
              try {
                await fs.access(newDestPath);
              } catch {
                // Path doesn't exist, we can use it
                resolvedDestinationPath = newDestPath;
                break;
              }
            } while (counter < 100); // Prevent infinite loop
          }
          // If overwrite is true, we'll just use the existing path
        } catch (accessError) {
          // This is good - it means the path doesn't exist yet
        }
      } else {
        throw new Error("Destination exists and is not a directory");
      }
    } catch (statError) {
      // If destination doesn't exist, that's fine
      // Just make sure the destination parent directory exists
      const destParentDir = path.dirname(resolvedDestinationPath);
      try {
        await fs.access(destParentDir);
      } catch (accessError) {
        // Create the destination parent directory if it doesn't exist
        await fs.mkdir(destParentDir, { recursive: true });
      }
    }

    // Create the destination directory
    await fs.mkdir(resolvedDestinationPath, { recursive: true });

    // Recursively copy all contents
    await copyDirectoryContents(resolvedSourcePath, resolvedDestinationPath, options);

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error copying directory: ${error.message}`);
    }
    throw new Error(`Unknown error occurred`);
  }
}

/**
 * Move a directory from one location to another
 * Handles cross-device moves by falling back to recursive copy + delete
 */
export async function moveDirectory(sourcePath: string, destinationPath: string): Promise<void> {
  try {
    // Resolve paths relative to workspace
    const resolvedSourcePath = resolveWorkspacePath(sourcePath, DEFAULT_WORKSPACE);
    let resolvedDestinationPath = resolveWorkspacePath(destinationPath, DEFAULT_WORKSPACE);

    // Check if source directory exists and is a directory
    const sourceStats = await fs.stat(resolvedSourcePath);
    if (!sourceStats.isDirectory()) {
      throw new Error("Source path must be a directory");
    }

    // Check if destination exists
    try {
      const destStats = await fs.stat(resolvedDestinationPath);

      // If destination is a directory, we'll move the source directory inside it
      if (destStats.isDirectory()) {
        const sourceBaseName = path.basename(resolvedSourcePath);
        resolvedDestinationPath = path.join(resolvedDestinationPath, sourceBaseName);

        // Check if the target path already exists
        try {
          await fs.access(resolvedDestinationPath);
          throw new Error(`Destination already exists: ${resolvedDestinationPath}`);
        } catch (accessError) {
          // This is good - it means the path doesn't exist yet
        }
      } else {
        throw new Error("Destination exists and is not a directory");
      }
    } catch (statError) {
      // If destination doesn't exist, that's fine
      // Just make sure the destination parent directory exists
      const destParentDir = path.dirname(resolvedDestinationPath);
      try {
        await fs.access(destParentDir);
      } catch (accessError) {
        // Create the destination parent directory if it doesn't exist
        await fs.mkdir(destParentDir, { recursive: true });
      }
    }

    try {
      // Try to use rename (works on same device and for empty directories)
      await fs.rename(resolvedSourcePath, resolvedDestinationPath);
    } catch (renameError) {
      // If rename fails (possibly cross-device or non-empty directory), use recursive copy + delete
      if (renameError instanceof Error) {
        // Create the destination directory
        await fs.mkdir(resolvedDestinationPath, { recursive: true });

        // Recursively copy all contents
        await copyDirectoryContents(resolvedSourcePath, resolvedDestinationPath, { overwrite: true });

        // Remove the source directory
        await fs.rm(resolvedSourcePath, { recursive: true, force: true });
      } else {
        // If it's another error, rethrow it
        throw renameError;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error moving directory: ${error.message}`);
    }
    throw new Error(`Unknown error occurred`);
  }
}