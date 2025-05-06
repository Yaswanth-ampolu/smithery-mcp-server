import fs from 'fs/promises';
import path from 'path';
import net from 'net';
import { getDefaultWorkspace, ensureWorkspaceExists, resolveWorkspacePath } from './platform-paths.js';

// Define the configuration interface
export interface McpConfig {
  port: number;
  host: string;
  serverName: string;
  serverVersion: string;
  workspace: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  // Add more configuration options as needed
}

// Default configuration values
const DEFAULT_CONFIG: McpConfig = {
  port: 8080,
  host: '0.0.0.0',
  serverName: 'MCP System Tools',
  serverVersion: '1.0.0',
  workspace: ensureWorkspaceExists(getDefaultWorkspace()),
  logLevel: 'info'
};

// Get the installation directory (where the config file will be stored)
function getInstallDir(): string {
  // The configuration file should be stored in the MCP terminal installation directory
  // which is typically the current working directory when the server is started

  // First, try to use the current working directory
  const cwd = process.cwd();

  // Check if we're in the MCP terminal directory by looking for key files
  let isMcpDir = false;
  try {
    // Use the synchronous version from the 'fs' module, not the Promise-based one
    const fsSync = require('fs');
    isMcpDir =
      fsSync.existsSync(path.join(cwd, 'package.json')) ||
      fsSync.existsSync(path.join(cwd, 'dist', 'main.js'));
  } catch (error) {
    console.error('Error checking for MCP directory:', error);
  }

  if (isMcpDir) {
    console.log(`Using current directory for configuration: ${cwd}`);
    return cwd;
  }

  // If we're not in the MCP terminal directory, try to find it
  try {
    // For ESM modules, try to determine from the module path
    const moduleUrl = new URL(import.meta.url);
    const modulePath = path.dirname(moduleUrl.pathname);
    // Go up two levels (from /dist/config.js to /)
    const installDir = path.resolve(modulePath, '../..');
    console.log(`Using module path for configuration: ${installDir}`);
    return installDir;
  } catch (error) {
    // If all else fails, use the MCP_INSTALL_DIR environment variable or fall back to a default
    const installDir = process.env.MCP_INSTALL_DIR || path.join(process.env.HOME || process.env.USERPROFILE || '.', 'mcp-terminal');
    console.log(`Using fallback path for configuration: ${installDir}`);
    return installDir;
  }
}

// Path to the configuration file
const CONFIG_FILE_PATH = path.join(getInstallDir(), 'mcp-config.json');

/**
 * Load configuration from file
 * If the file doesn't exist, create it with default values
 */
export async function loadConfig(): Promise<McpConfig> {
  try {
    // Try to read the configuration file
    const configData = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    const config = JSON.parse(configData);

    // Merge with defaults to ensure all properties exist
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    // If file doesn't exist or is invalid, create it with default values
    console.log('Configuration file not found or invalid. Creating default configuration.');
    await saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: McpConfig): Promise<void> {
  try {
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
    console.log(`Configuration saved to ${CONFIG_FILE_PATH}`);
  } catch (error) {
    console.error('Error saving configuration:', error);
    throw error;
  }
}

/**
 * Update specific configuration values
 */
export async function updateConfig(updates: Partial<McpConfig>): Promise<McpConfig> {
  const currentConfig = await loadConfig();
  const updatedConfig = { ...currentConfig, ...updates };
  await saveConfig(updatedConfig);
  return updatedConfig;
}

/**
 * Check if a port is available
 */
export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false); // Port is in use
      } else {
        // Some other error occurred
        console.error(`Error checking port ${port}:`, err);
        resolve(false);
      }
    });

    server.once('listening', () => {
      // Close the server and resolve with true (port is available)
      server.close(() => {
        resolve(true);
      });
    });

    // Try to listen on the port
    server.listen(port);
  });
}

/**
 * Find the next available port starting from the given port
 */
export async function findAvailablePort(startPort: number, maxAttempts = 10): Promise<number> {
  let port = startPort;
  let attempts = 0;

  while (attempts < maxAttempts) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
    attempts++;
  }

  // If we couldn't find an available port, return the original port
  // and let the server handle the error
  console.warn(`Could not find available port after ${maxAttempts} attempts. Returning original port ${startPort}.`);
  return startPort;
}
