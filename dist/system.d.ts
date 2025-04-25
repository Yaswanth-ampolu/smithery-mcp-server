/**
 * Run a shell command and return its output
 */
export declare function runShellCommand(command: string): Promise<string>;
/**
 * Run a Python file and return its output
 */
export declare function runPythonFile(filePath: string, args?: string): Promise<string>;
/**
 * Read a directory and list its contents
 */
export declare function readDirectory(dirPath: string): Promise<{
    files: string[];
    directories: string[];
    path: string;
}>;
/**
 * Copy a file from source to destination
 */
export declare function copyFile(sourcePath: string, destinationPath: string): Promise<void>;
/**
 * Create a new file with specified contents
 */
export declare function createFile(filePath: string, content: string): Promise<void>;
/**
 * Read a file and return its contents
 * Optionally specify line range to read only part of the file
 */
export declare function readFile(filePath: string, options?: {
    encoding?: BufferEncoding;
    startLine?: number;
    endLine?: number;
}): Promise<string>;
/**
 * Edit a file with various operations (append, prepend, replace, insert)
 */
export declare function editFile(filePath: string, options: {
    operation: 'append' | 'prepend' | 'replace' | 'insert';
    content: string;
    lineNumber?: number;
    startLine?: number;
    endLine?: number;
    encoding?: BufferEncoding;
}): Promise<void>;
/**
 * Delete a file from the filesystem
 */
export declare function deleteFile(filePath: string): Promise<void>;
/**
 * Move a file from one location to another
 * Handles cross-device moves by falling back to copy + delete
 */
export declare function moveFile(sourcePath: string, destinationPath: string): Promise<void>;
/**
 * Create a directory with optional recursive creation
 */
export declare function createDirectory(dirPath: string, recursive?: boolean): Promise<void>;
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
export declare function getDirectoryTree(dirPath: string, options?: {
    maxDepth?: number;
    includeFiles?: boolean;
    includeDirs?: boolean;
    includeSize?: boolean;
    extensions?: string[];
    exclude?: string[];
}): Promise<DirectoryTreeNode>;
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
export declare function combinationTask(workingDir: string, tasks: CombinationTask[], options?: {
    stopOnError?: boolean;
}): Promise<CombinationTaskResult[]>;
/**
 * Delete a directory with optional recursive deletion
 */
export declare function deleteDirectory(dirPath: string, recursive?: boolean): Promise<void>;
/**
 * Copy a directory from one location to another with options for handling existing files
 */
export declare function copyDirectory(sourcePath: string, destinationPath: string, options?: {
    overwrite?: boolean;
    errorOnExist?: boolean;
}): Promise<void>;
/**
 * Move a directory from one location to another
 * Handles cross-device moves by falling back to recursive copy + delete
 */
export declare function moveDirectory(sourcePath: string, destinationPath: string): Promise<void>;
