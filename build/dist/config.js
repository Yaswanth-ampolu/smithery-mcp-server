import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import net from 'net';
import { getDefaultWorkspace, ensureWorkspaceExists, resolveWorkspacePath } from './platform-paths.js';
// Default configuration values
const DEFAULT_CONFIG = {
    port: 8080,
    host: '0.0.0.0',
    serverName: 'MCP System Tools',
    serverVersion: '1.0.0',
    workspace: ensureWorkspaceExists(getDefaultWorkspace()),
    logLevel: 'info'
};
// Get the installation directory (where the config file will be stored)
function getInstallDir() {
    // The configuration file should ALWAYS be stored in the MCP terminal installation directory
    // First, check if MCP_INSTALL_DIR environment variable is set
    if (process.env.MCP_INSTALL_DIR) {
        console.log(`Using MCP_INSTALL_DIR for configuration: ${process.env.MCP_INSTALL_DIR}`);
        return process.env.MCP_INSTALL_DIR;
    }
    // Next, try to find the installation directory from the PID file
    // The PID file is always in the installation directory
    const homedir = process.env.HOME || process.env.USERPROFILE || '.';
    const mcpTerminalDir = path.join(homedir, 'mcp-terminal');
    // Check if the mcp-terminal directory exists in the home directory
    try {
        if (existsSync(mcpTerminalDir)) {
            console.log(`Using mcp-terminal directory for configuration: ${mcpTerminalDir}`);
            return mcpTerminalDir;
        }
    }
    catch (error) {
        console.error('Error checking mcp-terminal directory:', error);
    }
    // If we're running from the installation directory
    const cwd = process.cwd();
    try {
        if (cwd.endsWith('mcp-terminal') ||
            (existsSync(path.join(cwd, 'package.json')) &&
                existsSync(path.join(cwd, 'dist', 'main.js')))) {
            console.log(`Using current directory for configuration: ${cwd}`);
            return cwd;
        }
    }
    catch (error) {
        console.error('Error checking current directory:', error);
    }
    // If we're running from the dist directory
    if (cwd.endsWith(path.join('mcp-terminal', 'dist'))) {
        const parentDir = path.dirname(cwd);
        console.log(`Using parent directory for configuration: ${parentDir}`);
        return parentDir;
    }
    // Try to determine from the module path (for ESM modules)
    try {
        const moduleUrl = new URL(import.meta.url);
        const modulePath = path.dirname(moduleUrl.pathname);
        // Go up two levels (from /dist/config.js to /)
        const installDir = path.resolve(modulePath, '../..');
        // Only use this if it looks like an MCP terminal directory
        try {
            if (existsSync(path.join(installDir, 'package.json')) ||
                existsSync(path.join(installDir, 'dist', 'main.js'))) {
                console.log(`Using module path for configuration: ${installDir}`);
                return installDir;
            }
        }
        catch (error) {
            console.error('Error checking module path directory:', error);
        }
    }
    catch (error) {
        // Ignore errors from this approach
        console.error('Error determining module path:', error);
    }
    // As a last resort, use the default MCP terminal directory in the home directory
    console.log(`Using default path for configuration: ${mcpTerminalDir}`);
    return mcpTerminalDir;
}
// Path to the configuration file
const CONFIG_FILE_PATH = path.join(getInstallDir(), 'mcp-config.json');
/**
 * Load configuration from file
 * If the file doesn't exist, create it with default values
 */
export async function loadConfig() {
    try {
        // Try to read the configuration file
        const configData = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
        const config = JSON.parse(configData);
        // Merge with defaults to ensure all properties exist
        return { ...DEFAULT_CONFIG, ...config };
    }
    catch (error) {
        // If file doesn't exist or is invalid, create it with default values
        console.log('Configuration file not found or invalid. Creating default configuration.');
        await saveConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
    }
}
/**
 * Save configuration to file
 */
export async function saveConfig(config) {
    try {
        await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
        console.log(`Configuration saved to ${CONFIG_FILE_PATH}`);
    }
    catch (error) {
        console.error('Error saving configuration:', error);
        throw error;
    }
}
/**
 * Update specific configuration values
 */
export async function updateConfig(updates) {
    const currentConfig = await loadConfig();
    const updatedConfig = { ...currentConfig, ...updates };
    await saveConfig(updatedConfig);
    return updatedConfig;
}
/**
 * Check if a port is available
 */
export function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false); // Port is in use
            }
            else {
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
export async function findAvailablePort(startPort, maxAttempts = 10) {
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
//# sourceMappingURL=config.js.map