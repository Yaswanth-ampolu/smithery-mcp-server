declare const PACKAGE_ROOT: string;
/**
 * Determine the default workspace based on environment
 */
declare function getDefaultWorkspace(): string;
/**
 * Create workspace if it doesn't exist
 */
declare function ensureWorkspaceExists(workspacePath: string): string;
/**
 * Resolve a path relative to the workspace
 */
declare function resolveWorkspacePath(relativePath: string, workspacePath: string): string;
export { PACKAGE_ROOT, getDefaultWorkspace, ensureWorkspaceExists, resolveWorkspacePath };
