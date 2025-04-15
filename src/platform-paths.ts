import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs';

/**
 * Get the package root directory
 */
function getPackageRoot(): string {
  try {
    // When used as ES module
    console.log('Trying to get package root in ESM mode');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packageRoot = path.resolve(__dirname, '..');
    console.log(`Package root resolved in ESM mode: ${packageRoot}`);
    return packageRoot;
  } catch (error) {
    // Fallback for CommonJS environment
    console.log('Falling back to CommonJS mode for package root');
    
    // Try to find package root from current file path
    try {
      // For CommonJS, __dirname and __filename are available
      const packageRoot = path.resolve(path.dirname(module.filename), '..');
      console.log(`Package root resolved in CommonJS mode: ${packageRoot}`);
      return packageRoot;
    } catch (innerError) {
      // Last resort - use CWD
      const cwd = process.cwd();
      console.log(`Using current working directory as fallback: ${cwd}`);
      return cwd;
    }
  }
}

// Get the directory where the package is installed
const PACKAGE_ROOT = getPackageRoot();
console.log(`Using package root: ${PACKAGE_ROOT}`);

/**
 * Determine the default workspace based on environment
 */
function getDefaultWorkspace(): string {
  // Try these locations in order:
  // 1. Environment variable if set
  // 2. Current working directory
  // 3. User's desktop folder
  // 4. User's home directory
  
  if (process.env.DEFAULT_WORKSPACE) {
    return process.env.DEFAULT_WORKSPACE;
  }
  
  const cwd = process.cwd();
  const desktop = path.join(os.homedir(), 'Desktop');
  const home = os.homedir();
  
  // Check if Desktop directory exists
  const desktopExists = fs.existsSync(desktop);
  
  // Return the first valid path
  if (fs.existsSync(path.join(cwd, 'workspace'))) {
    return path.join(cwd, 'workspace');
  } else if (desktopExists) {
    return path.join(desktop, 'mcp-workspace');
  } else {
    return path.join(home, 'mcp-workspace');
  }
}

/**
 * Create workspace if it doesn't exist
 */
function ensureWorkspaceExists(workspacePath: string): string {
  if (!fs.existsSync(workspacePath)) {
    try {
      fs.mkdirSync(workspacePath, { recursive: true });
      console.log(`Created workspace directory: ${workspacePath}`);
    } catch (error) {
      console.error(`Failed to create workspace: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return workspacePath;
}

/**
 * Resolve a path relative to the workspace
 */
function resolveWorkspacePath(relativePath: string, workspacePath: string): string {
  // If it's an absolute path, return it as is
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }

  // Otherwise, resolve it relative to the workspace
  return path.resolve(workspacePath, relativePath);
}

export {
  PACKAGE_ROOT,
  getDefaultWorkspace,
  ensureWorkspaceExists,
  resolveWorkspacePath
}; 