import { Router } from "express";
/**
 * Generate example usage for a tool based on its parameters
 */
export declare function generateExamples(toolName: string, parameters: Record<string, any>): string[];
/**
 * Create a router for the tools endpoints
 */
export declare function createToolsRouter(server: any): Router;
