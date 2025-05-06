export interface McpConfig {
    port: number;
    host: string;
    serverName: string;
    serverVersion: string;
    workspace: string;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
/**
 * Load configuration from file
 * If the file doesn't exist, create it with default values
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
 * Check if a port is available
 */
export declare function isPortAvailable(port: number): Promise<boolean>;
/**
 * Find the next available port starting from the given port
 */
export declare function findAvailablePort(startPort: number, maxAttempts?: number): Promise<number>;
