#!/usr/bin/env node

/**
 * CLI entry point for the MCP server
 * This allows the package to be installed globally and run as a command
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get this script's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

// Possible entry points in priority order
const possibleEntryPoints = [
  path.join(packageRoot, 'dist', 'main.js'),
  path.join(packageRoot, 'dist', 'smithery-adapter.js')
];

// Find the first entry point that exists
let entryPointToRun = null;
for (const entryPoint of possibleEntryPoints) {
  if (fs.existsSync(entryPoint)) {
    entryPointToRun = entryPoint;
    break;
  }
}

if (!entryPointToRun) {
  console.error(`Error: Cannot find any main application file.`);
  console.error(`Checked: ${possibleEntryPoints.join(', ')}`);
  console.error('Did you build the project? Try running "npm run build" first.');
  process.exit(1);
}

console.log(`Starting MCP server from: ${entryPointToRun}`);

// Execute the entry point
import(entryPointToRun).catch(err => {
  console.error('Error starting the application:', err);
  process.exit(1);
}); 