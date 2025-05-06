/**
 * Configuration Manager for MCP Server
 *
 * This module handles loading, saving, and managing the MCP server configuration.
 * It provides functions to read and write the configuration file, as well as
 * get and update configuration values with appropriate defaults.
 */
import { z } from 'zod';
declare const ConfigSchema: z.ZodObject<{
    port: z.ZodDefault<z.ZodNumber>;
    host: z.ZodDefault<z.ZodString>;
    serverName: z.ZodDefault<z.ZodString>;
    serverVersion: z.ZodDefault<z.ZodString>;
    workspace: z.ZodDefault<z.ZodString>;
    lastStartTime: z.ZodOptional<z.ZodString>;
    autoSelectPort: z.ZodDefault<z.ZodBoolean>;
    maxPortRetries: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    port: number;
    host: string;
    serverName: string;
    serverVersion: string;
    workspace: string;
    autoSelectPort: boolean;
    maxPortRetries: number;
    lastStartTime?: string | undefined;
}, {
    port?: number | undefined;
    host?: string | undefined;
    serverName?: string | undefined;
    serverVersion?: string | undefined;
    workspace?: string | undefined;
    lastStartTime?: string | undefined;
    autoSelectPort?: boolean | undefined;
    maxPortRetries?: number | undefined;
}>;
export type McpConfig = z.infer<typeof ConfigSchema>;
/**
 * Get the path to the configuration file
 */
export declare function getConfigPath(): string;
/**
 * Load configuration from file
 * If the file doesn't exist, return default configuration
 */
export declare function loadConfig(): Promise<McpConfig>;
/**
 * Save configuration to file
 */
export declare function saveConfig(config: McpConfig): Promise<void>;
/**
 * Update specific configuration values
 */
export declare function updateConfig(updates: Partial<McpConfig>): Promise<McpConfig>;
/**
 * Get a specific configuration value with fallback to environment variables
 */
export declare function getConfigValue<K extends keyof McpConfig>(config: McpConfig, key: K, envVarName?: string): McpConfig[K];
/**
 * Update the configuration with the port that was successfully used
 */
export declare function updatePortInConfig(port: number): Promise<void>;
/**
 * Get the port to use for the server
 * Considers environment variables, configuration, and defaults
 */
export declare function getServerPort(config: McpConfig): number;
/**
 * Get the host to use for the server
 */
export declare function getServerHost(config: McpConfig): string;
/**
 * Get the server name to use
 */
export declare function getServerName(config: McpConfig): string;
/**
 * Get the server version to use
 */
export declare function getServerVersion(config: McpConfig): string;
/**
 * Get the workspace path to use
 */
export declare function getWorkspacePath(config: McpConfig): string;
export {};
