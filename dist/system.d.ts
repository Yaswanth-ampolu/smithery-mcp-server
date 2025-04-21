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
