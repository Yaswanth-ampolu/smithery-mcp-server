/**
 * Configuration Manager for MCP Server
 *
 * This module handles loading, saving, and managing the MCP server configuration.
 * It provides functions to read and write the configuration file, as well as
 * get and update configuration values with appropriate defaults.
 */
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { z } from 'zod';
// Define the configuration schema using Zod for validation
const ConfigSchema = z.object({
    port: z.number().int().min(1).max(65535).default(8080),
    host: z.string().default('0.0.0.0'),
    serverName: z.string().default('MCP System Tools'),
    serverVersion: z.string().default('1.0.0'),
    workspace: z.string().default(path.join(os.homedir(), 'mcp-workspace')),
    lastStartTime: z.string().optional(),
    autoSelectPort: z.boolean().default(true),
    maxPortRetries: z.number().int().min(1).max(100).default(10)
});
// Default configuration
const DEFAULT_CONFIG = {
    port: 8080,
    host: '0.0.0.0',
    serverName: 'MCP System Tools',
    serverVersion: '1.0.0',
    workspace: path.join(os.homedir(), 'mcp-workspace'),
    autoSelectPort: true,
    maxPortRetries: 10
};
/**
 * Get the path to the configuration file
 */
export function getConfigPath() {
    // Default to the MCP terminal installation directory
    const installDir = process.env.MCP_INSTALL_DIR || path.join(os.homedir(), 'mcp-terminal');
    return path.join(installDir, 'mcp-config.json');
}
/**
 * Load configuration from file
 * If the file doesn't exist, return default configuration
 */
export async function loadConfig() {
    const configPath = getConfigPath();
    try {
        // Check if the file exists
        await fs.access(configPath);
        // Read and parse the configuration file
        const configData = await fs.readFile(configPath, 'utf8');
        const parsedConfig = JSON.parse(configData);
        // Validate the configuration against the schema
        const validatedConfig = ConfigSchema.parse(parsedConfig);
        console.log(`Loaded configuration from ${configPath}`);
        return validatedConfig;
    }
    catch (error) {
        if (error instanceof Error) {
            console.warn(`Could not load configuration from ${configPath}: ${error.message}`);
            console.log('Using default configuration');
        }
        // Return default configuration if file doesn't exist or is invalid
        return { ...DEFAULT_CONFIG };
    }
}
/**
 * Save configuration to file
 */
export async function saveConfig(config) {
    const configPath = getConfigPath();
    try {
        // Ensure the directory exists
        const configDir = path.dirname(configPath);
        await fs.mkdir(configDir, { recursive: true });
        // Validate the configuration against the schema
        const validatedConfig = ConfigSchema.parse(config);
        // Write the configuration to file
        await fs.writeFile(configPath, JSON.stringify(validatedConfig, null, 2), 'utf8');
        console.log(`Saved configuration to ${configPath}`);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Failed to save configuration to ${configPath}: ${error.message}`);
        }
    }
}
/**
 * Update specific configuration values
 */
export async function updateConfig(updates) {
    // Load the current configuration
    const currentConfig = await loadConfig();
    // Merge the updates with the current configuration
    const updatedConfig = {
        ...currentConfig,
        ...updates
    };
    // Save the updated configuration
    await saveConfig(updatedConfig);
    return updatedConfig;
}
/**
 * Get a specific configuration value with fallback to environment variables
 */
export function getConfigValue(config, key, envVarName) {
    // If environment variable is specified and exists, use it
    if (envVarName && process.env[envVarName] !== undefined) {
        const envValue = process.env[envVarName];
        // Convert the environment variable to the appropriate type
        switch (typeof config[key]) {
            case 'number':
                return Number(envValue);
            case 'boolean':
                return (envValue === 'true');
            default:
                return envValue;
        }
    }
    // Otherwise, use the configuration value
    return config[key];
}
/**
 * Update the configuration with the port that was successfully used
 */
export async function updatePortInConfig(port) {
    await updateConfig({
        port,
        lastStartTime: new Date().toISOString()
    });
}
/**
 * Get the port to use for the server
 * Considers environment variables, configuration, and defaults
 */
export function getServerPort(config) {
    // Environment variable takes precedence
    if (process.env.PORT) {
        return parseInt(process.env.PORT, 10);
    }
    // Otherwise, use the configuration value
    return config.port;
}
/**
 * Get the host to use for the server
 */
export function getServerHost(config) {
    // Environment variable takes precedence
    return process.env.MCP_SERVER_HOST || config.host;
}
/**
 * Get the server name to use
 */
export function getServerName(config) {
    // Environment variable takes precedence
    return process.env.SERVER_NAME || config.serverName;
}
/**
 * Get the server version to use
 */
export function getServerVersion(config) {
    // Environment variable takes precedence
    return process.env.SERVER_VERSION || config.serverVersion;
}
/**
 * Get the workspace path to use
 */
export function getWorkspacePath(config) {
    // Environment variable takes precedence
    return process.env.DEFAULT_WORKSPACE || config.workspace;
}
//# sourceMappingURL=config-manager.js.map