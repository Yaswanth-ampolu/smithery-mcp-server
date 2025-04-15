#!/usr/bin/env node

/**
 * CLI entry point for the MCP server
 * This allows the package to be installed globally and run as a command
 */

// Using CommonJS require for better compatibility in global installs
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

// Log the current execution context
console.log(`Starting MCP Terminal Tools CLI`);
console.log(`CLI file: ${__filename}`);
console.log(`Process directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);

// Get the directory where this script is located
const scriptDir = path.dirname(__filename);
console.log(`Script directory: ${scriptDir}`);

// Get the package root directory
const packageRoot = path.resolve(scriptDir, '..');
console.log(`Package root: ${packageRoot}`);

// List files in the package root to debug
try {
  console.log(`Files in package root:`);
  fs.readdirSync(packageRoot).forEach(file => {
    console.log(`- ${file}`);
  });
} catch (err) {
  console.error(`Error reading package root: ${err.message}`);
}

// Also list files in the bin directory
try {
  console.log(`Files in bin directory:`);
  fs.readdirSync(scriptDir).forEach(file => {
    console.log(`- ${file}`);
  });
} catch (err) {
  console.error(`Error reading bin directory: ${err.message}`);
}

// Possible entry points in priority order
const possibleEntryPoints = [
  path.join(packageRoot, 'dist', 'main.js'),
  path.join(packageRoot, 'dist', 'smithery-adapter.js')
];

// Check if dist directory exists
const distDir = path.join(packageRoot, 'dist');
if (!fs.existsSync(distDir)) {
  console.log(`Dist directory not found: ${distDir}`);
  
  // Check if src directory exists and attempt to build
  const srcDir = path.join(packageRoot, 'src');
  if (fs.existsSync(srcDir)) {
    console.log(`Source directory found. Attempting to build...`);
    try {
      child_process.execSync('npx tsc -p tsconfig.json', {
        cwd: packageRoot,
        stdio: 'inherit'
      });
      console.log(`Build successful.`);
    } catch (err) {
      console.error(`Failed to build: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.error(`Neither dist nor src directories found. Cannot continue.`);
    process.exit(1);
  }
}

// Find the first entry point that exists
let entryPointToRun = null;
for (const entryPoint of possibleEntryPoints) {
  console.log(`Checking for entry point: ${entryPoint}`);
  if (fs.existsSync(entryPoint)) {
    entryPointToRun = entryPoint;
    console.log(`Found entry point: ${entryPoint}`);
    break;
  }
}

if (!entryPointToRun) {
  console.error(`Error: Cannot find any main application file.`);
  console.error(`Checked: ${possibleEntryPoints.join(', ')}`);
  process.exit(1);
}

console.log(`Starting MCP server from: ${entryPointToRun}`);

// Run the entry point as a child process (most reliable cross-platform approach)
const child = child_process.spawn(process.execPath, [entryPointToRun], {
  stdio: 'inherit',
  detached: false
});

child.on('error', (err) => {
  console.error(`Failed to start process: ${err.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
}); 